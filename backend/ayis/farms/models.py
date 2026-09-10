"""
AYIS farm models — Farm, FarmRegion, OfficerAssignment.

All three models are defined here so Django's migration autodetector
picks them up in a single initial migration.
This is the single source of truth for farm-related models.
"""

from django.contrib.gis.db import models as geo_models
from django.db import models
from django.conf import settings


class Farm(models.Model):
    """
    A farm owned by a user (farmer or officer-assigned).
    Location is a PostGIS Point in WGS84 (SRID 4326). Area is in hectares.
    """

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farms",
        help_text="Farm owner / primary responsible user.",
    )
    name = models.CharField(max_length=255, help_text="Farm name or identifier.")
    location = geo_models.PointField(
        srid=4326, null=True, blank=True,
        help_text="Farm center point (WGS84 longitude/latitude).",
    )
    area_ha = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True,
        help_text="Farm area in hectares.",
    )
    notes = models.TextField(blank=True, default="", help_text="Free-text notes about the farm.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "farm"
        verbose_name_plural = "farms"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.owner.username})"

    @property
    def longitude(self):
        return self.location.x if self.location else None

    @property
    def latitude(self):
        return self.location.y if self.location else None


class FarmRegion(models.Model):
    """
    A geographic region (e.g. county, ward, agricultural zone).
    Regions are used for officer assignments and regional reporting.
    """

    name = models.CharField(max_length=200, help_text="Region name.")
    region_type = models.CharField(
        max_length=50,
        choices=[('county', 'County'), ('ward', 'Ward'), ('zone', 'Agricultural Zone'), ('custom', 'Custom Region')],
        default='county', help_text="Type of region.",
    )
    boundary = geo_models.MultiPolygonField(
        srid=4326, null=True, blank=True,
        help_text="Geographic boundary of the region (WGS84).",
    )
    description = models.TextField(blank=True, default="", help_text="Description of the region.")
    external_ref = models.CharField(max_length=100, blank=True, default="", help_text="External reference code.")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="created_regions", help_text="User who created this region.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "farm region"
        verbose_name_plural = "farm regions"
        unique_together = [('name', 'region_type')]
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.name} ({self.region_type})"

    def farms_in_region(self):
        """Return queryset of farms within this region (PostGIS ST_Within)."""
        if self.boundary:
            return Farm.objects.filter(location__within=self.boundary)
        return Farm.objects.none()

    @property
    def farm_count(self) -> int:
        return self.farms_in_region().count()


class OfficerAssignment(models.Model):
    """
    Assigns an agricultural officer to a farm region.
    Officers can only view farms, cycles, and data within their assigned regions.
    """

    officer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="region_assignments",
        limit_choices_to={'role': 'officer'},
        help_text="Agricultural officer assigned to this region.",
    )
    region = models.ForeignKey(
        FarmRegion, on_delete=models.CASCADE,
        related_name="assignments",
        help_text="Region the officer is assigned to.",
    )
    assignment_type = models.CharField(
        max_length=50,
        choices=[('primary', 'Primary'), ('secondary', 'Secondary'), ('acting', 'Acting')],
        default='primary', help_text="Type of assignment.",
    )
    notes = models.TextField(blank=True, default="", help_text="Notes about this assignment.")
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "officer assignment"
        verbose_name_plural = "officer assignments"
        unique_together = [('officer', 'region')]
        ordering = ['officer__username', 'region__name']

    def __str__(self) -> str:
        return f"{self.officer.get_username()} → {self.region.name}"

    def accessible_farms(self):
        """Return queryset of farms accessible through this assignment."""
        if self.region.boundary:
            return Farm.objects.filter(location__within=self.region.boundary)
        return Farm.objects.all()

    @property
    def farm_count(self) -> int:
        return self.accessible_farms().count()
