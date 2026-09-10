"""
AYIS Farms service layer.

Encapsulates all farm business logic:
- Scope filtering by user role
- Ownership checks
- Coordinate handling
- GeoJSON serialization
- Bounding box queries
"""

from django.contrib.gis.geos import Point
from django.db.models import Q

from ayis.farms.models import Farm
from ayis.users.models import User


class FarmService:
    """
    Stateless service for farm operations.

    All methods accept an explicit user and queryset/manager so they
    can be tested in isolation and reused across views, tasks, and
    background jobs.
    """

    @staticmethod
    def get_visible_queryset(user: User):
        """
        Return the queryset of farms visible to the given user.

        - Admin: all farms
        - Officer: farms in their assigned region (placeholder: own farms)
        - Farmer: own farms only
        """
        if user.role == User.Role.ADMIN:
            return Farm.objects.all()
        if user.role == User.Role.OFFICER:
            # TODO: replace with region-based filtering when officer regions exist
            return Farm.objects.filter(owner=user)
        # Farmer: own farms only
        return Farm.objects.filter(owner=user)

    @staticmethod
    def can_edit(user: User, farm: Farm) -> bool:
        """Check whether a user can edit a specific farm."""
        if user.role == User.Role.ADMIN:
            return True
        return farm.owner_id == user.id

    @staticmethod
    def can_delete(user: User, farm: Farm) -> bool:
        """Check whether a user can delete a specific farm."""
        return FarmService.can_edit(user, farm)

    @staticmethod
    def create_farm(user: User, name: str, location_point: Point | None,
                    area_ha: float | None, notes: str = "") -> Farm:
        """
        Create a farm for the given user.

        The requesting user is always the owner unless admin overrides.
        """
        return Farm.objects.create(
            owner=user,
            name=name,
            location=location_point,
            area_ha=area_ha,
            notes=notes,
        )

    @staticmethod
    def update_farm(farm: Farm, user: User, **updates) -> Farm:
        """
        Update a farm if the user has permission.

        Raises PermissionError if the user cannot edit the farm.
        """
        if not FarmService.can_edit(user, farm):
            raise PermissionError("You can only update your own farms.")
        for key, value in updates.items():
            if hasattr(farm, key):
                setattr(farm, key, value)
        farm.save()
        return farm

    @staticmethod
    def delete_farm(farm: Farm, user: User) -> None:
        """
        Delete a farm if the user has permission.

        Raises PermissionError if the user cannot delete the farm.
        """
        if not FarmService.can_delete(user, farm):
            raise PermissionError("You can only delete your own farms.")
        farm.delete()

    @staticmethod
    def get_geojson_feature_collection(user: User):
        """
        Return farms visible to the user as a GeoJSON FeatureCollection.

        Used by the map endpoint.
        """
        queryset = FarmService.get_visible_queryset(user)
        features = []
        for farm in queryset:
            geom = farm.location
            coords = [geom.x, geom.y] if geom else None
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords,
                },
                "properties": {
                    "id": farm.id,
                    "name": farm.name,
                    "area_ha": float(farm.area_ha) if farm.area_ha else None,
                    "notes": farm.notes,
                    "owner_username": farm.owner.username if farm.owner else None,
                },
            })
        return {
            "type": "FeatureCollection",
            "features": features,
        }

    @staticmethod
    def filter_by_bbox(user: User, min_lon: float, min_lat: float,
                        max_lon: float, max_lat: float):
        """
        Return farms within a bounding box, scoped to the user's visibility.

        Uses PostGIS `__within` lookup.
        """
        queryset = FarmService.get_visible_queryset(user)
        bbox = (min_lon, min_lat, max_lon, max_lat)
        return queryset.filter(location__within=bbox)


# Singleton service instance for import convenience
farm_service = FarmService()
