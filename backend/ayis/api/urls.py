"""
AYIS — root v1 API router.

App-specific routes are included here. This is the entry point for the
versioned API.
"""

from django.urls import path, include

urlpatterns = [
    path("", include("ayis.api.views_router")),
    path("farms/", include("ayis.farms.urls")),
    path("users/", include("ayis.users.urls")),
]