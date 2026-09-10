"""
AYIS Farms serializers.

- FarmSerializer: standard CRUD representation
- FarmGeoJSONSerializer: GeoJSON Feature serialization for map rendering
- FarmCreateSerializer: restricted write serializer (owner set by viewset)
"""

from rest_framework import serializers

from ayis.farms.models import Farm
from ayis.api.serializers import TimestampedSerializerMixin


class FarmCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for farm creation.

    Owner is excluded — the viewset sets it from the request user.
    Location is accepted as lon/lat pair or GeoJSON point.
    """

    longitude = serializers.FloatField(
        write_only=True, required=False, allow_null=True,
        help_text="Farm center longitude (WGS84)."
    )
    latitude = serializers.FloatField(
        write_only=True, required=False, allow_null=True,
        help_text="Farm center latitude (WGS84)."
    )

    class Meta:
        model = Farm
        fields = [
            "id", "name", "longitude", "latitude",
            "area_ha", "notes",
        ]

    def validate(self, attrs):
        lon = attrs.get("longitude")
        lat = attrs.get("latitude")
        if lon is not None and lat is not None:
            try:
                from django.contrib.gis.geos import Point
                attrs["location"] = Point(lon, lat, srid=4326)
            except Exception:
                raise serializers.ValidationError({
                    "location": "Invalid coordinates."
                })
        elif lon is not None or lat is not None:
            raise serializers.ValidationError({
                "location": "Both longitude and latitude are required for a point."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop("longitude", None)
        validated_data.pop("latitude", None)
        return super().create(validated_data)


class FarmSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    """
    Read serializer for farms.

    Includes derived longitude/latitude fields for frontend convenience.
    """

    longitude = serializers.FloatField(read_only=True, allow_null=True)
    latitude = serializers.FloatField(read_only=True, allow_null=True)
    owner = serializers.PrimaryKeyRelatedField(
        read_only=True, default=None
    )
    owner_username = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = [
            "id", "owner", "owner_username", "name",
            "longitude", "latitude", "area_ha", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def get_owner_username(self, obj):
        return obj.owner.username if obj.owner else None


class FarmGeoJSONSerializer(serializers.ModelSerializer):
    """
    GeoJSON Feature serializer for map rendering.

    Output shape: {type: "Feature", geometry: {type: "Point", coordinates: [...]}, properties: {...}}
    """

    class Meta:
        model = Farm
        fields = [
            "id", "name", "area_ha", "notes",
            "created_at", "updated_at",
        ]

    def to_representation(self, instance):
        geom = instance.location
        coordinates = [geom.x, geom.y] if geom else None

        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": coordinates,
            },
            "properties": {
                "id": instance.id,
                "name": instance.name,
                "area_ha": float(instance.area_ha) if instance.area_ha else None,
                "notes": instance.notes,
                "owner_username": instance.owner.username if instance.owner else None,
                "created_at": instance.created_at.isoformat() if instance.created_at else None,
                "updated_at": instance.updated_at.isoformat() if instance.updated_at else None,
            },
        }
