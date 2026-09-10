from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ayis.farms.views import FarmViewSet

router = DefaultRouter()

router.register(r"farms", FarmViewSet, basename="farm")

urlpatterns = router.urls
