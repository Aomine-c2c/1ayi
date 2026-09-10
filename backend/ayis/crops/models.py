"""
AYIS crops models.

Crops and varieties with growing requirements, environmental needs,
expected yield characteristics, and seasonal information.

All data here is OBSERVED (from agronomic datasets, seed catalogs, etc.).
"""

from django.db import models
from ayis.users.models import User


class Crop(models.Model):
    """
    A crop species (e.g. Maize, Wheat, Beans, Rice, Sunflower).

    Contains general agronomic characteristics and expected yield data.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Common name of the crop (e.g. 'Maize').",
    )

    scientific_name = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="Scientific / Latin name (e.g. 'Zea mays').",
    )

    category = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Crop category (e.g. 'cereal', 'legume', 'oilseed', 'vegetable').",
    )

    description = models.TextField(
        blank=True,
        default="",
        help_text="General description of the crop.",
    )

    # Growing period (days from planting to harvest, typical range)
    growing_days_min = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Minimum growing period in days.",
    )
    growing_days_max = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Maximum growing period in days.",
    )
    growing_days_typical = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Typical growing period in days.",
    )

    # Planting requirements
    planting_depth_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended planting depth in cm.",
    )
    planting_spacing_cm = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended plant spacing in cm.",
    )
    seeds_per_gram = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Number of seeds per gram (for seeding rate calculation).",
    )
    seeding_rate_kg_ha = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended seeding rate in kg/ha.",
    )

    # Environmental requirements
    optimal_temp_min = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Optimal temperature minimum (°C).",
    )
    optimal_temp_max = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Optimal temperature maximum (°C).",
    )
    frost_sensitive = models.BooleanField(
        default=True,
        help_text="Whether the crop is sensitive to frost.",
    )
    drought_tolerant = models.BooleanField(
        default=False,
        help_text="Whether the crop has drought tolerance.",
    )
    flood_tolerant = models.BooleanField(
        default=False,
        help_text="Whether the crop has flood tolerance.",
    )
    soil_ph_min = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Minimum preferred soil pH.",
    )
    soil_ph_max = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Maximum preferred soil pH.",
    )
    sunlight_hours_min = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Minimum daily sunlight hours required.",
    )

    # Rainfall requirements
    rainfall_min_mm = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Minimum rainfall required for the growing period (mm).",
    )
    rainfall_optimum_mm = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optimum rainfall for the growing period (mm).",
    )
    rainfall_max_mm = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum tolerable rainfall for the growing period (mm).",
    )

    # Expected yield characteristics
    expected_yield_min_kg_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected minimum yield (kg/ha) under good conditions.",
    )
    expected_yield_max_kg_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected maximum yield (kg/ha) under excellent conditions.",
    )
    expected_yield_typical_kg_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected typical yield (kg/ha) under average conditions.",
    )

    # Seasonal information
    planting_season = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Recommended planting season (e.g. 'long rains', 'short rains', 'spring').",
    )
    harvest_season = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Expected harvest season.",
    )
    suitable_months = models.JSONField(
        default=list,
        help_text="List of suitable months for planting (1-12).",
    )

    # Data provenance
    source = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Source of crop data (e.g. 'FAO', 'national-agricultural-extension').",
    )
    source_url = models.URLField(
        blank=True,
        default="",
        help_text="URL of the source data if available.",
    )

    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this crop is available for use in the system.",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_crops",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "crop"
        verbose_name_plural = "crops"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def growing_days_range(self) -> tuple | None:
        if self.growing_days_min is not None and self.growing_days_max is not None:
            return (self.growing_days_min, self.growing_days_max)
        return None

    @property
    def optimal_temp_range(self) -> tuple | None:
        if self.optimal_temp_min is not None and self.optimal_temp_max is not None:
            return (float(self.optimal_temp_min), float(self.optimal_temp_max))
        return None

    @property
    def rainfall_range(self) -> tuple | None:
        if self.rainfall_min_mm is not None and self.rainfall_max_mm is not None:
            return (self.rainfall_min_mm, self.rainfall_max_mm)
        return None


class Variety(models.Model):
    """
    A specific variety / cultivar of a crop.

    Varieties have specific characteristics that differ from the crop average.
    """

    crop = models.ForeignKey(
        Crop,
        on_delete=models.CASCADE,
        related_name="varieties",
        help_text="The crop this variety belongs to.",
    )

    name = models.CharField(
        max_length=150,
        help_text="Variety name/cultivar (e.g. 'H614', 'SC713').",
    )

    breeder = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Breeder or seed company (e.g. 'Pioneer', 'Kenya Seed Company').",
    )

    description = models.TextField(
        blank=True,
        default="",
        help_text="Description of the variety.",
    )

    # Maturity
    maturity_days_early = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Days to maturity (early estimate).",
    )
    maturity_days_late = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Days to maturity (late estimate).",
    )
    maturity_days_typical = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Typical days to maturity.",
    )

    # Variety-specific yield
    yield_sd_min_kg_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected yield range minimum (kg/ha) for this variety.",
    )
    yield_sd_max_kg_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected yield range maximum (kg/ha) for this variety.",
    )
    yield_sd_typical_kg_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected typical yield (kg/ha) for this variety.",
    )

    # Variety characteristics
    disease_resistance = models.TextField(
        blank=True,
        default="",
        help_text="Disease resistance profile (free text).",
    )
    pest_resistance = models.TextField(
        blank=True,
        default="",
        help_text="Pest resistance profile (free text).",
    )
    drought_tolerance_level = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Drought tolerance level (e.g. 'high', 'medium', 'low').",
    )
    seed_color = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Seed color (for identification).",
    )

    # Adaptation
    adaptation_zones = models.JSONField(
        default=list,
        help_text="Geographic/climatic zones this variety is adapted to.",
    )
    recommended_regions = models.JSONField(
        default=list,
        help_text="Recommended regions for this variety.",
    )

    # Metadata
    is_recommended = models.BooleanField(
        default=False,
        help_text="Whether this variety is recommended by default.",
    )
    source = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Source of variety data.",
    )
    source_url = models.URLField(
        blank=True,
        default="",
        help_text="URL of the source data.",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_varieties",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "variety"
        verbose_name_plural = "varieties"
        ordering = ["crop__name", "name"]
        unique_together = [["crop", "name"]]
        indexes = [
            models.Index(fields=["crop", "is_recommended"]),
        ]

    def __str__(self) -> str:
        return f"{self.crop.name} — {self.name}"


class CropRequirement(models.Model):
    """
    Detailed planting requirements for a crop in a specific context.

    Extends the crop-level requirements with location-specific or
    practice-specific recommendations.
    """

    crop = models.ForeignKey(
        Crop,
        on_delete=models.CASCADE,
        related_name="requirements",
    )

    context = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Context for these requirements (e.g. 'irrigated', 'rainfed', 'highland').",
    )

    soil_type = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Recommended soil type.",
    )
    soil_texture = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Recommended soil texture (e.g. 'loam', 'clay', 'sandy').",
    )

    # Fertility
    nitrogen_kg_ha = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended nitrogen application (kg/ha).",
    )
    phosphorus_kg_ha = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended phosphorus application (kg/ha).",
    )
    potassium_kg_ha = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Recommended potassium application (kg/ha).",
    )

    irrigation_required = models.BooleanField(
        default=False,
        help_text="Whether irrigation is required for this crop in this context.",
    )
    irrigation_water_mm = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Recommended irrigation water amount (mm) if irrigated.",
    )

    # Planting
    planting_months = models.JSONField(
        default=list,
        help_text="Recommended planting months for this context.",
    )
    planting_method = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Recommended planting method (e.g. 'direct', 'transplant', 'broadcast').",
    )

    # Data
    source = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Source of requirement data.",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_crop_requirements",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "crop requirement"
        verbose_name_plural = "crop requirements"
        ordering = ["crop__name", "context"]

    def __str__(self) -> str:
        ctx = self.context or "general"
        return f"{self.crop.name} requirements ({ctx})"
