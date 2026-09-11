from datetime import date
from django.db import models
from ayis.farms.models import Farm
from ayis.crops.models import Crop, Variety
from ayis.users.models import User

# Register cross-cutting models so Django's app registry discovers them.
# These are loaded via the app's models.py so migrations pick them up
# without needing ready() imports (which run too early for get_user_model).
# NOTE: stage_history_models has its own circular import handling via TYPE_CHECKING


class GrowthStage(models.TextChoices):
    """Standard growth stages for crop cycles."""
    NOT_PLANTED = "not_planted", "Not Planted"
    PLANTED = "planted", "Planted"
    GERMINATED = "germinated", "Germinated"
    VEGETATIVE = "vegetative", "Vegetative Growth"
    REPRODUCTIVE = "reproductive", "Reproductive Stage"
    HARVEST_READY = "harvest_ready", "Harvest Ready"
    HARVESTED = "harvested", "Harvested"
    FAILED = "failed", "Failed"


class CycleStatus(models.TextChoices):
    """Overall status of a crop cycle."""
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class CropCycle(models.Model):
    """
    A single crop cycle: a specific crop planted on a specific farm.

    This is the central domain entity that ties together farms, crops,
    weather, intelligence, and production data.
    """

    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="crop_cycles",
        help_text="Farm where this cycle is grown.",
    )

    crop = models.ForeignKey(
        Crop,
        on_delete=models.PROTECT,
        related_name="cycles",
        help_text="Crop being grown.",
    )

    variety = models.ForeignKey(
        Variety,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cycles",
        help_text="Specific variety planted (optional).",
    )

    # Timeline
    planting_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date the crop was planted.",
    )
    expected_harvest_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expected harvest date (calculated or entered).",
    )
    actual_harvest_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual harvest date (filled after harvest).",
    )

    # Growth tracking
    current_stage = models.CharField(
        max_length=20,
        choices=GrowthStage.choices,
        default=GrowthStage.NOT_PLANTED,
        help_text="Current growth stage.",
    )
    stage_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the current stage was last updated.",
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=CycleStatus.choices,
        default=CycleStatus.PLANNED,
        help_text="Overall cycle status.",
    )

    # Area and density
    area_ha = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Area planted in this cycle (ha).",
    )
    plant_density_plants_per_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Planting density (plants per hectare).",
    )

    # Seed usage
    seeds_used_kg = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Amount of seed used (kg).",
    )
    seeds_used_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cost of seeds used (currency units).",
    )

    # Fertilizer usage (accumulated)
    fertilizer_nitrogen_kg = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        default=0,
        help_text="Total nitrogen applied (kg).",
    )
    fertilizer_phosphorus_kg = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        default=0,
        help_text="Total phosphorus applied (kg).",
    )
    fertilizer_potassium_kg = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        default=0,
        help_text="Total potassium applied (kg).",
    )
    fertilizer_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Total fertilizer cost (currency units).",
    )

    # Irrigation (accumulated)
    irrigation_events = models.PositiveIntegerField(
        default=0,
        help_text="Number of irrigation events.",
    )
    irrigation_water_total_liters = models.PositiveIntegerField(
        default=0,
        help_text="Total irrigation water used (liters).",
    )
    irrigation_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Total irrigation cost (currency units).",
    )

    # Pest/disease management (accumulated)
    pesticide_applications = models.PositiveIntegerField(
        default=0,
        help_text="Number of pesticide applications.",
    )
    pesticide_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Total pesticide cost (currency units).",
    )
    disease_incidents = models.PositiveIntegerField(
        default=0,
        help_text="Number of disease incidents recorded.",
    )

    # Labor (accumulated)
    labor_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Total labor hours spent on this cycle.",
    )
    labor_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Total labor cost (currency units).",
    )

    # Notes
    notes = models.TextField(
        blank=True,
        default="",
        help_text="General notes about this cycle.",
    )

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_cycles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "crop cycle"
        verbose_name_plural = "crop cycles"
        ordering = ["-planting_date"]
        indexes = [
            models.Index(fields=["farm", "status"]),
            models.Index(fields=["farm", "crop", "planting_date"]),
            models.Index(fields=["status", "current_stage"]),
            models.Index(fields=["expected_harvest_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.crop.name} on {self.farm.name} (planted {self.planting_date or 'not yet planted'})"

    @property
    def days_since_planting(self) -> int | None:
        if self.planting_date:
            from datetime import date
            return (date.today() - self.planting_date).days
        return None

    @property
    def days_to_expected_harvest(self) -> int | None:
        if self.expected_harvest_date:
            from datetime import date
            delta = self.expected_harvest_date - date.today()
            return delta.days
        return None

    @property
    def total_inputs_cost(self) -> float:
        return float(
            (self.seeds_used_cost or 0)
            + (self.fertilizer_cost or 0)
            + (self.irrigation_cost or 0)
            + (self.pesticide_cost or 0)
            + (self.labor_cost or 0)
        )

    def update_stage(self, new_stage: str, updated_by: User | None = None) -> None:
        """Update the current growth stage with timestamp."""
        self.current_stage = new_stage
        from django.utils import timezone
        self.stage_updated_at = timezone.now()
        self.save()

    def mark_harvested(self, harvest_date: date | None = None) -> None:
        """Mark the cycle as harvested."""
        from django.utils import timezone
        from datetime import date
        if harvest_date is None:
            harvest_date = date.today()
        self.actual_harvest_date = harvest_date
        self.current_stage = GrowthStage.HARVESTED
        self.status = CycleStatus.COMPLETED
        self.save()
