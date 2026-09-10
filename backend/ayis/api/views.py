"""
AYIS — API views: health, metadata, and the v1 router root.

Health is unauthenticated so load balancers / Tauri can probe readiness.
All other endpoints live in the app-specific url modules.
"""

from django.http import JsonResponse


def health(request):
    """
    Readiness probe.

    Returns 200 with basic service status. No authentication required.
    """
    return JsonResponse(
        {
            "status": "ok",
            "service": "AYIS API",
            "version": "1.0.0",
        }
    )


def api_info(request):
    """
    API metadata endpoint.

    Returns version, data-classification legend, and links to docs.
    Unauthenticated — useful for the frontend on first load.
    """
    return JsonResponse(
        {
            "service": "AYIS API",
            "version": "1.0.0",
            "data_classification_legend": {
                "observed": "Received from external sources or entered by users.",
                "calculated": "Mathematically derived from observed data.",
                "predicted": "Produced by a predictive model. Not a guarantee.",
                "recommended": "An interpretation generated from the available evidence.",
            },
            "docs": "/api/v1/schema/swagger-ui/",
        }
    )
