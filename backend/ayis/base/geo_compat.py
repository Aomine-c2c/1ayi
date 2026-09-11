"""
AYIS Geographic Compatibility Module.

Transparently imports GIS fields (PointField, MultiPolygonField, Point)
from django.contrib.gis when GDAL is installed, or provides fallback
mock model fields when running in local development without OS GDAL.
"""

from django.db import models

try:
    from django.contrib.gis.db import models as geo_models
    from django.contrib.gis.geos import Point, MultiPolygon
    HAS_GIS = True
except Exception:
    HAS_GIS = False

    class MockPoint:
        def __init__(self, x=0.0, y=0.0, srid=4326):
            self.x = float(x)
            self.y = float(y)
            self.srid = srid

        def __repr__(self):
            return f"Point({self.x}, {self.y})"

    Point = MockPoint
    MultiPolygon = object

    class FallbackPointField(models.Field):
        description = "Fallback PointField storing coordinates as JSON/text without GDAL"

        def __init__(self, srid=4326, *args, **kwargs):
            self.srid = srid
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
            super().__init__(*args, **kwargs)

        def get_internal_type(self):
            return "TextField"

    class FallbackMultiPolygonField(models.Field):
        description = "Fallback MultiPolygonField without GDAL"

        def __init__(self, srid=4326, *args, **kwargs):
            self.srid = srid
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
            super().__init__(*args, **kwargs)

        def get_internal_type(self):
            return "TextField"

    class MockGeoModels:
        PointField = FallbackPointField
        MultiPolygonField = FallbackMultiPolygonField

    geo_models = MockGeoModels()
