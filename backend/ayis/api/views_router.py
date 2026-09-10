"""
AYIS — v1 API router root views.

Provides API discovery endpoints and the DRF router root.
"""

from django.urls import path

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ayis.api.views import health, api_info


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """
    API discovery root.

    Returns links to the main resource groups.
    """
    return Response(
        {
            "name": "AYIS API v1",
            "description": "Agricultural Yield Intelligence System",
            "links": {
                "health": "/api/v1/health/",
                "info": "/api/v1/info/",
                "schema": "/api/v1/schema/",
                "swagger_ui": "/api/v1/schema/swagger-ui/",
            },
        }
    )


urlpatterns = [
    path("", api_root, name="api-root"),
]
