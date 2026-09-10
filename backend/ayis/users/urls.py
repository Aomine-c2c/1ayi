from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from ayis.users.views import (
    TokenObtainView,
    TokenBlacklistView,
    RegisterView,
    UserProfileView,
    UserListView,
)


urlpatterns = [
    # Auth
    path("auth/token/", TokenObtainView.as_view(), name="token-obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/token/blacklist/", TokenBlacklistView.as_view(), name="token-blacklist"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    # Users
    path("users/me/", UserProfileView.as_view(), name="user-profile-me"),
    path("users/", UserListView.as_view(), name="user-list"),
]
