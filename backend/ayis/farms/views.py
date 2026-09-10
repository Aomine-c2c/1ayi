"""
AYIS Farms API views — thin layer.

All business logic is delegated to ayis.farms.services.FarmService.
Views validate input, call the service, and return responses.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers

from ayis.farms.models import Farm
from ayis.farms.serializers import FarmSerializer, FarmCreateSerializer, FarmGeoJSONSerializer
from ayis.farms.services import farm_service
from ayis.users.models import User


class FarmViewSet(viewsets.ModelViewSet):
    """
    Farm CRUD endpoint.

    List/Create: farmers see own farms; admins see all.
    Retrieve/Update/Delete: owner-only or admin.
    """

    queryset = Farm.objects.all()
    permission_classes = ["ayis.api.permissions.IsAuthenticated"]
    # serializer_class set per-action in get_serializer_class()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return FarmCreateSerializer
        if self.action == "geojson":
            return FarmGeoJSONSerializer
        return FarmSerializer

    def get_queryset(self):
        """Scope farms to what the current user can see."""
        user = self.request.user
        return farm_service.get_visible_queryset(user)

    def perform_create(self, serializer):
        """Create a farm via the service layer."""
        user = self.request.user
        location = serializer.validated_data.get("location")
        farm = farm_service.create_farm(
            user=user,
            name=serializer.validated_data["name"],
            location_point=location,
            area_ha=serializer.validated_data.get("area_ha"),
            notes=serializer.validated_data.get("notes", ""),
        )
        # Store for the response
        self.object = farm

    def perform_update(self, serializer):
        """Update a farm via the service layer."""
        user = self.request.user
        farm = serializer.instance
        try:
            farm_service.update_farm(
                farm=farm,
                user=user,
                name=serializer.validated_data.get("name", farm.name),
                location_point=serializer.validated_data.get("location", farm.location),
                area_ha=serializer.validated_data.get("area_ha", farm.area_ha),
                notes=serializer.validated_data.get("notes", farm.notes),
            )
        except PermissionError as e:
            raise drf_serializers.ValidationError({"owner": str(e)})

    def perform_destroy(self, instance):
        """Delete a farm via the service layer."""
        user = self.request.user
        try:
            farm_service.delete_farm(farm=instance, user=user)
        except PermissionError as e:
            raise drf_serializers.ValidationError({"owner": str(e)})

    @action(detail=False, methods=["get"], url_path="geojson")
    def geojson(self, request):
        """Return farms as GeoJSON FeatureCollection."""
        user = request.user
        feature_collection = farm_service.get_geojson_feature_collection(user)
        return Response(feature_collection)

    @action(detail=False, methods=["get"], url_path="within")
    def within(self, request):
        """Query farms within a bounding box."""
        user = request.user
        min_lon = request.query_params.get("min_lon")
        min_lat = request.query_params.get("min_lat")
        max_lon = request.query_params.get("max_lon")
        max_lat = request.query_params.get("max_lat")

        if not all([min_lon, min_lat, max_lon, max_lat]):
            return Response(
                {"error": "Provide min_lon, min_lat, max_lon, max_lat"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bbox = (
                float(min_lon), float(min_lat),
                float(max_lon), float(max_lat),
            )
        except (ValueError, TypeError):
            return Response(
                {"error": "Bounding box coordinates must be numbers"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        farms = farm_service.filter_by_bbox(user, *bbox)
        serializer = self.get_serializer(farms, many=True)
        return Response(serializer.data)
