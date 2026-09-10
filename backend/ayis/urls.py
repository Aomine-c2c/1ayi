from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from ayis.api.views import health, api_info


urlpatterns = [
    # Health + metadata (no auth required)
    path("api/v1/health/", health, name="api-health"),
    path("api/v1/info/", api_info, name="api-info"),
    # OpenAPI schema
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # v1 API
    path("api/v1/", include("ayis.api.urls")),
]
