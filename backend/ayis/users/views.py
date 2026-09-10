"""
AYIS Users API views.

Provides:
- User registration
- JWT token obtain (login)
- Token blacklist (logout)
- Current user profile (me)
- User list (admin/officer only)
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenViewBase
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from ayis.users.serializers import (
    UserSerializer,
    UserRegisterSerializer,
    UserProfileSerializer,
)
from ayis.users.services import user_service


User = get_user_model()


class TokenObtainView(TokenViewBase):
    """
    Obtain an access + refresh token pair.

    Accepts username + password. Returns JWT tokens.
    """
    serializer_class = TokenObtainPairSerializer


class TokenBlacklistView(APIView):
    """
    Logout: blacklist the current refresh token.

    Clients should send the refresh token in the body.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "refresh token required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = OutstandingToken.objects.get(token=refresh_token)
            BlacklistedToken.objects.get_or_create(token=token)
            return Response({"status": "logged_out"})
        except OutstandingToken.DoesNotExist:
            return Response(
                {"error": "token not found or already expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.

    Anyone can register (no auth required). New users default to farmer role.
    """
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        try:
            user = user_service.create_user(
                username=validated["username"],
                email=validated.get("email", ""),
                password=validated["password"],
                first_name=validated.get("first_name", ""),
                last_name=validated.get("last_name", ""),
                role=validated.get("role", User.Role.FARMER),
            )
        except ValueError as e:
            return Response(
                {"error": "registration_failed", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the current authenticated user's profile.

    Only the requesting user can access their own profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = self.request.user
        validated = serializer.validated_data
        try:
            user_service.update_user_profile(
                user=user,
                first_name=validated.get("first_name", user.first_name),
                last_name=validated.get("last_name", user.last_name),
                email=validated.get("email", user.email),
                is_active=validated.get("is_active", user.is_active),
            )
        except ValueError as e:
            raise serializers.ValidationError({"non_field_errors": str(e)})


class UserListView(generics.ListAPIView):
    """
    List all users.

    Admin and officer roles only.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return user_service.list_users_for_role(user)
