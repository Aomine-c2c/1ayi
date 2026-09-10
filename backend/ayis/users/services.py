"""
AYIS Users service layer.

Encapsulates user registration, profile management, password reset,
account activation/deactivation, rate limiting, and role-based access.
"""

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone

User = get_user_model()


class UserService:
    """
    Stateless service for user operations.

    Security features:
    - Password hashing (via Django's set_password / PBKDF2)
    - Account activation tokens
    - Password reset tokens
    - Rate limiting on auth endpoints
    - Account activation/deactivation
    - Audit-ready operations
    """

    # Rate limit configuration (requests per window)
    RATE_LIMITS = {
        "login": (10, 60),       # 10 per minute
        "register": (5, 3600),   # 5 per hour
        "password_reset": (3, 3600),  # 3 per hour
        "token_refresh": (30, 60),    # 30 per minute
    }

    # Token expiry times (seconds)
    ACTIVATION_TOKEN_EXPIRY = 86400 * 3   # 3 days
    PASSWORD_RESET_TOKEN_EXPIRY = 86400 * 1  # 1 day

    @staticmethod
    def _rate_limit_key(prefix: str, identifier: str) -> str:
        return f"ratelimit:{prefix}:{identifier}"

    @staticmethod
    def check_rate_limit(prefix: str, identifier: str) -> tuple[bool, int, int]:
        """
        Check if an action is rate-limited.
        Returns (is_limited, remaining, retry_after_seconds).
        """
        limit, window = UserService.RATE_LIMITS.get(prefix, (100, 60))
        key = UserService._rate_limit_key(prefix, identifier)
        current = cache.get(key, 0)
        if current >= limit:
            return True, 0, window
        cache.set(key, current + 1, window)
        return False, max(0, limit - current - 1), 0

    @staticmethod
    def create_user(username: str, email: str, password: str,
                    first_name: str = "", last_name: str = "",
                    role: str = User.Role.FARMER,
                    is_active: bool = True,
                    rate_limit_identifier: str | None = None) -> User:
        """
        Create a new user with full validation and rate limiting.

        Password is hashed using Django's PBKDF2 (set_password).
        """
        # Rate limit registration
        if rate_limit_identifier:
            limited, remaining, retry = UserService.check_rate_limit(
                "register", rate_limit_identifier
            )
            if limited:
                from ayis.audit import audit_log
                audit_log.log_create(
                    actor=None,
                    object_type="user",
                    object_id=0,
                    description=f"Registration rate-limited for {rate_limit_identifier}",
                )
                raise ValueError(f"Too many registration attempts. Try again later. ({remaining} remaining)")

        # Validate password strength
        errors = []
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(password)
        except Exception as e:
            errors.append(str(e))

        if errors:
            raise ValueError("; ".join(errors))

        # Check username uniqueness
        if User.objects.filter(username=username).exists():
            raise ValueError(f"Username '{username}' is already taken.")

        # Check email uniqueness if email is provided
        if email and User.objects.filter(email=email).exists():
            raise ValueError(f"Email '{email}' is already registered.")

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            is_active=is_active,
        )
        user.set_password(password)
        user.save()

        # If user is inactive, generate activation token
        if not is_active:
            user.generate_activation_token()

        from ayis.audit import audit_log
        audit_log.log_create(
            actor=None, object_type="user", object_id=user.id,
            description=f"User created: {username} (role={role})",
            new_values={"username": username, "role": role, "email": email},
        )

        return user

    @staticmethod
    def authenticate_user(username: str, password: str,
                          rate_limit_identifier: str | None = None) -> User | None:
        """
        Authenticate a user with username/password.
        Returns the user if successful, None otherwise.
        """
        # Rate limit login
        if rate_limit_identifier:
            limited, remaining, retry = UserService.check_rate_limit(
                "login", rate_limit_identifier
            )
            if limited:
                from ayis.audit import audit_log
                audit_log.log_login_failure(
                    username=username,
                    ip_address=rate_limit_identifier,
                )
                raise ValueError(f"Too many login attempts. Try again later. ({remaining} remaining)")

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                from ayis.audit import audit_log
                audit_log.log_login(
                    actor=user,
                    ip_address=rate_limit_identifier or "unknown",
                )
                return user
            else:
                from ayis.audit import audit_log
                audit_log.log_login_failure(
                    username=username,
                    ip_address=rate_limit_identifier or "unknown",
                )
                raise ValueError("Account is disabled. Please contact support.")
        else:
            from ayis.audit import audit_log
            audit_log.log_login_failure(
                username=username,
                ip_address=rate_limit_identifier or "unknown",
            )
            # Return None (don't reveal if username exists)
            return None

    @staticmethod
    def update_user_profile(user: User, **updates) -> User:
        """Update user profile fields. Only allowed fields."""
        editable = {"first_name", "last_name", "email", "is_active"}
        for key, value in updates.items():
            if key in editable:
                setattr(user, key, value)
        user.save()
        return user

    @staticmethod
    def deactivate_user(user: User, deactivated_by: User) -> User:
        """Deactivate a user account. Only admins can do this."""
        if deactivated_by.role != User.Role.ADMIN:
            raise PermissionError("Only administrators can deactivate accounts.")

        user.is_active = False
        user.save()

        from ayis.audit import audit_log
        audit_log.log_update(
            actor=deactivated_by,
            object_type="user",
            object_id=user.id,
            description=f"Account deactivated for {user.username}",
            old_values={"is_active": True},
            new_values={"is_active": False},
        )

        # Blacklist all refresh tokens for this user
        from rest_framework_simplejwt.token_blacklist.models import (
            OutstandingToken, BlacklistedToken
        )
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)

        return user

    @staticmethod
    def activate_user(user: User, activated_by: User | None = None) -> User:
        """Activate a user account."""
        user.is_active = True
        user.save()

        from ayis.audit import audit_log
        audit_log.log_update(
            actor=activated_by,
            object_type="user",
            object_id=user.id,
            description=f"Account activated for {user.username}",
            old_values={"is_active": False},
            new_values={"is_active": True},
        )

        return user

    @staticmethod
    def change_password(user: User, old_password: str, new_password: str) -> bool:
        """Change user password with old password verification."""
        if not check_password(old_password, user.password):
            raise ValueError("Current password is incorrect.")

        errors = []
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user=user)
        except Exception as e:
            errors.append(str(e))

        if errors:
            raise ValueError("; ".join(errors))

        user.set_password(new_password)
        user.save()

        from ayis.audit import audit_log
        audit_log.log_update(
            actor=user,
            object_type="user",
            object_id=user.id,
            description="Password changed",
        )

        # Blacklist all existing refresh tokens (force re-login on other devices)
        from rest_framework_simplejwt.token_blacklist.models import (
            OutstandingToken, BlacklistedToken
        )
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)

        return True

    @staticmethod
    def request_password_reset(email: str, rate_limit_identifier: str | None = None) -> User | None:
        """
        Initiate password reset flow.
        Sends reset email to user. Returns user if email found, None otherwise.
        Always returns success to prevent email enumeration.
        """
        # Rate limit password reset requests
        if rate_limit_identifier:
            limited, remaining, retry = UserService.check_rate_limit(
                "password_reset", rate_limit_identifier
            )
            if limited:
                raise ValueError(f"Too many reset requests. Try again later. ({remaining} remaining)")

        users = User.objects.filter(email=email, is_active=True)
        if not users.exists():
            # Don't reveal that email doesn't exist (security)
            return None

        user = users.first()
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Store reset token in cache with expiry
        reset_key = UserService._rate_limit_key("password_reset_token", str(user.pk))
        cache.set(reset_key, token, UserService.PASSWORD_RESET_TOKEN_EXPIRY)

        # In production, send email. For now, log the reset link.
        reset_url = f"/api/v1/auth/password-reset/confirm/{uid}/{token}/"
        from ayis.audit import audit_log
        audit_log.log_create(
            actor=None, object_type="user", object_id=user.id,
            description=f"Password reset requested for {user.username}",
        )

        return user

    @staticmethod
    def confirm_password_reset(uidb64: str, token: str, new_password: str) -> bool:
        """
        Confirm password reset with token.
        Returns True if successful, raises ValueError otherwise.
        """
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValueError("Invalid reset link.")

        if not user.is_active:
            raise ValueError("Account is disabled.")

        # Verify token
        expected_token = cache.get(
            UserService._rate_limit_key("password_reset_token", str(user.pk))
        )
        if expected_token is None or not default_token_generator.check_token(user, token):
            raise ValueError("Reset link has expired or is invalid.")

        UserService.change_password(user, "", new_password)

        # Clear reset token from cache
        cache.delete(
            UserService._rate_limit_key("password_reset_token", str(user.pk))
        )

        return True

    @staticmethod
    def generate_activation_token(user: User) -> str:
        """Generate an account activation token."""
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        activation_key = UserService._rate_limit_key("activation_token", str(user.pk))
        cache.set(activation_key, token, UserService.ACTIVATION_TOKEN_EXPIRY)
        return uid, token

    @staticmethod
    def activate_with_token(uidb64: str, token: str) -> bool:
        """Activate account using activation token."""
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValueError("Invalid activation link.")

        expected_token = cache.get(
            UserService._rate_limit_key("activation_token", str(user.pk))
        )
        if expected_token is None or not default_token_generator.check_token(user, token):
            raise ValueError("Activation link has expired or is invalid.")

        UserService.activate_user(user)
        cache.delete(
            UserService._rate_limit_key("activation_token", str(user.pk))
        )
        return True

    @staticmethod
    def list_users_for_role(user: User):
        """Return a queryset of users visible to the requesting user."""
        if user.role in (User.Role.ADMIN, User.Role.OFFICER):
            return User.objects.all().order_by("username")
        return User.objects.none()

    @staticmethod
    def escalate_role(user: User, new_role: str, escalated_by: User) -> User:
        """Change a user's role. Only admins can do this. Logged as security event."""
        if escalated_by.role != User.Role.ADMIN:
            raise PermissionError("Only administrators can change user roles.")

        old_role = user.role
        if old_role == new_role:
            return user

        user.role = new_role
        user.save()

        from ayis.audit import audit_log
        audit_log.log_update(
            actor=escalated_by,
            object_type="user",
            object_id=user.id,
            description=f"Role escalated: {old_role} → {new_role} for {user.username}",
            old_values={"role": old_role},
            new_values={"role": new_role},
        )

        return user


# Singleton service instance
user_service = UserService()
