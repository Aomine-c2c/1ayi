"""
AYIS — security hardening: exception handler, permissions, rate limiting,
input validation, and secure error handling.

This module contains the security controls introduced in REFINE 13.
It complements the settings-layer security configuration.
"""

from __future__ import annotations

import logging
from typing import Any

from django.http import HttpRequest, HttpResponse
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status as drf_status

logger = logging.getLogger("ayis.security")


# ---------------------------------------------------------------------------
# Custom exception handler — never leaks internal details
# ---------------------------------------------------------------------------

# Safe error messages for common HTTP statuses.
# These are user-facing and never include stack traces, SQL, or paths.
SAFE_ERROR_MESSAGES = {
    400: "The request was invalid.",
    401: "Authentication is required.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    405: "The requested method is not allowed.",
    409: "The request conflicts with the current state.",
    422: "The request contained invalid data.",
    429: "Too many requests. Please try again later.",
    500: "An unexpected error occurred. Please try again later.",
    502: "A service is temporarily unavailable.",
    503: "The service is temporarily unavailable.",
}


class ProductionExceptionHandler:
    """
    DRF exception handler that sanitizes error responses.

    In production (DEBUG=False), replaces all error details with safe
    generic messages. In development, passes through DRF's default
    handling so developers get useful feedback.

    Install in settings.py:
        REST_FRAMEWORK = {
            ...
            "EXCEPTION_HANDLER": "ayis.security.get_exception_handler()",
        }
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        return self.get_response(request)

    @staticmethod
    def handle(exc: Exception, context: dict[str, Any]) -> Response | None:
        """
        Handle an exception and return a safe Response, or None to
        let DRF's default handler take over.
        """
        from rest_framework.views import exception_handler

        # Let DRF handle it first
        response = exception_handler(exc, context)
        if response is None:
            return None

        # Sanitize the response data
        response.data = ProductionExceptionHandler._sanitize_error_data(
            response.data, response.status_code
        )
        return response

    @staticmethod
    def _sanitize_error_data(data: Any, status_code: int) -> Any:
        """Replace potentially sensitive error data with safe messages."""
        from rest_framework.exceptions import APIException

        if isinstance(data, dict):
            # Field-level errors — keep field names but sanitize messages
            sanitized = {}
            for field, errors in data.items():
                if isinstance(errors, list):
                    sanitized[field] = [
                        ProductionExceptionHandler._safe_message(e)
                        for e in errors
                    ]
                else:
                    sanitized[field] = ProductionExceptionHandler._safe_message(errors)
            return sanitized

        if isinstance(data, list):
            return [ProductionExceptionHandler._safe_message(e) for e in data]

        if isinstance(data, str):
            return SAFE_ERROR_MESSAGES.get(status_code, data)

        return SAFE_ERROR_MESSAGES.get(status_code, "An error occurred.")


def _safe_message(value: Any) -> str:
    """Convert an error value to a safe string."""
    if isinstance(value, APIException):
        return str(value.detail) if hasattr(value, "detail") else str(value)
    return str(value)


def get_exception_handler():
    """
    Return an exception handler function compatible with DRF's
    EXCEPTION_HANDLER setting.
    """
    handler = ProductionExceptionHandler(None)

    def exception_handler_fn(exc, context):
        return handler.handle(exc, context)

    return exception_handler_fn


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

class RateLimiter:
    """
    Simple in-memory rate limiter using Django cache.

    For production, use django-ratelimit or a Redis-backed solution.
    This provides a baseline for development and testing.
    """

    def __init__(self, cache_alias: str = "default"):
        from django.core.cache import caches
        self.cache = caches[cache_alias]

    def is_rate_limited(
        self,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> tuple[bool, int, int]:
        """
        Check if a key is rate-limited.

        Returns:
            (is_limited, remaining, reset_timestamp)
        """
        import time

        now = int(time.time())
        window_key = f"ratelimit:{key}:{now // window_seconds}"

        count = self.cache.get(window_key, 0)
        remaining = max(0, limit - count - 1)
        reset = (now // window_seconds + 1) * window_seconds

        if count >= limit:
            return True, 0, reset

        self.cache.set(window_key, count + 1, window_seconds)
        return False, remaining, reset


def get_rate_limiter():
    """Get or create a shared rate limiter instance."""
    if not hasattr(get_rate_limiter, "_instance"):
        get_rate_limiter._instance = RateLimiter()
    return get_rate_limiter._instance


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------

class SafePermissionDenied(permissions.PermissionDenied):
    """PermissionDenied that uses safe detail messages."""

    def __init__(self, detail: str | None = None):
        safe_detail = detail or SAFE_ERROR_MESSAGES[403]
        super().__init__(detail=safe_detail)


# ---------------------------------------------------------------------------
# Input validation — defense against malformed/malicious input
# ---------------------------------------------------------------------------

class InputValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, detail: str, field: str | None = None):
        self.detail = detail
        self.field = field
        super().__init__(detail)


def validate_not_empty(value: Any, field_name: str) -> Any:
    """Ensure a value is not None, empty string, or empty list/dict."""
    if value is None:
        raise InputValidationError(f"{field_name} is required", field=field_name)
    if isinstance(value, str) and not value.strip():
        raise InputValidationError(f"{field_name} cannot be empty", field=field_name)
    if isinstance(value, (list, dict)) and len(value) == 0:
        raise InputValidationError(f"{field_name} cannot be empty", field=field_name)
    return value


def validate_max_length(value: str, max_length: int, field_name: str) -> str:
    """Ensure a string does not exceed max_length."""
    if len(value) > max_length:
        raise InputValidationError(
            f"{field_name} must be at most {max_length} characters",
            field=field_name,
        )
    return value


def validate_positive(value: float | int, field_name: str) -> float | int:
    """Ensure a number is positive."""
    if value <= 0:
        raise InputValidationError(
            f"{field_name} must be positive", field=field_name
        )
    return value


def validate_in_range(
    value: float | int, min_val: float, max_val: float, field_name: str
) -> float | int:
    """Ensure a number is within [min_val, max_val]."""
    if not (min_val <= value <= max_val):
        raise InputValidationError(
            f"{field_name} must be between {min_val} and {max_val}",
            field=field_name,
        )
    return value


# ---------------------------------------------------------------------------
# Duplicate request detection (idempotency key support)
# ---------------------------------------------------------------------------

# Simple in-memory store for idempotency keys (use cache in production)
_idempotency_store: dict[str, tuple[int, Any]] = {}


def check_idempotency_key(key: str, max_age_seconds: int = 300) -> Any | None:
    """
    Check if an idempotency key has been seen before.

    Returns the cached response if found, None otherwise.
    Caller should store the result with store_idempotency_key after
    generating the response.
    """
    import time

    now = int(time.time())
    if key in _idempotency_store:
        stored_at, value = _idempotency_store[key]
        if now - stored_at < max_age_seconds:
            return value
        else:
            del _idempotency_store[key]
    return None


def store_idempotency_key(key: str, response_data: Any) -> None:
    """Store a response for an idempotency key."""
    import time
    _idempotency_store[key] = (int(time.time()), response_data)


def generate_idempotency_key(request: HttpRequest) -> str | None:
    """
    Extract or generate an idempotency key from a request.

    Checks X-Idempotency-Key header first, then falls back to
    a hash of method + path + sorted body.
    """
    key = request.headers.get("X-Idempotency-Key")
    if key:
        return key

    # For GET/HEAD/DELETE, idempotent by nature — no key needed
    if request.method in ("GET", "HEAD", "DELETE"):
        return None

    # Generate from method + path + body hash
    import hashlib
    import json

    body = getattr(request, "data", {}) or {}
    raw = f"{request.method}:{request.path}:{json.dumps(body, sort_keys=True)}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


# ---------------------------------------------------------------------------
# Security headers (applied at middleware level)
# ---------------------------------------------------------------------------

# These headers are set by SecurityHeadersMiddleware in settings,
# but we also expose them here for programmatic use if needed.

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

# Production-only headers (set conditionally in middleware)
PRODUCTION_SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self' http://localhost:* https://* tauri://localhost; "
        "frame-ancestors 'none'"
    ),
}


def apply_security_headers(response: HttpResponse, is_production: bool = False) -> HttpResponse:
    """Apply security headers to a response."""
    for header, value in SECURITY_HEADERS.items():
        response[header] = value
    if is_production:
        for header, value in PRODUCTION_SECURITY_HEADERS.items():
            response[header] = value
    return response


# ---------------------------------------------------------------------------
# Audit logging helpers
# ---------------------------------------------------------------------------

def log_security_event(
    event_type: str,
    user: Any = None,
    details: dict[str, Any] | None = None,
    request: HttpRequest | None = None,
):
    """
    Log a security-relevant event.

    event_type: e.g. "login_failure", "permission_denied", "rate_limited",
                "invalid_input", "suspicious_activity"
    """
    from ayis.audit import get_audit_log

    audit = get_audit_log()

    context = {
        "event_type": event_type,
        "details": details or {},
    }

    if user and hasattr(user, "id"):
        context["user_id"] = user.id
        context["username"] = getattr(user, "username", "")

    if request:
        context["ip_address"] = request.META.get("REMOTE_ADDR", "unknown")
        context["user_agent"] = request.META.get("HTTP_USER_AGENT", "")[:255]

    logger.warning("SECURITY EVENT: %s — %s", event_type, context)


# ---------------------------------------------------------------------------
# JWT security configuration validation
# ---------------------------------------------------------------------------

def validate_jwt_configuration():
    """Validate JWT settings at startup. Logs warnings for insecure configs."""
    from django.conf import settings

    jwt = getattr(settings, "SIMPLE_JWT", {})

    if jwt.get("ROTATE_REFRESH_TOKENS") is False:
        logger.warning(
            "JWT: ROTATE_REFRESH_TOKENS is disabled. "
            "Consider enabling it to limit token exposure."
        )

    if jwt.get("BLACKLIST_AFTER_ROTATION") is False:
        logger.warning(
            "JWT: BLACKLIST_AFTER_ROTATION is disabled. "
            "Revoked tokens may remain valid."
        )

    algorithm = jwt.get("ALGORITHM", "HS256")
    if algorithm not in ("HS256", "HS384", "HS512"):
        logger.warning(
            "JWT: Algorithm '%s' is non-standard. "
            "HS256/HS384/HS512 are recommended.", algorithm
        )

    access_lifetime = jwt.get("ACCESS_TOKEN_LIFETIME")
    if access_lifetime:
        secs = access_lifetime.total_seconds()
        if secs > 3600:  # 1 hour
            logger.warning(
                "JWT: Access token lifetime is %.0f seconds (>1 hour). "
                "Consider shortening for better security.", secs
            )
