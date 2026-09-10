from django.db import models
from django.conf import settings
from typing import TYPE_CHECKING

# Lazily import related models to avoid circular imports during app registry population
if TYPE_CHECKING:
    from ayis.farms.models import Farm
    from ayis.users.models import User
    from ayis.crops.models import Crop, Variety

# Use lazy string references in FK fields instead of importing models


class IntelligenceResult(models.Model):
    """
    A single intelligence result.

    result_type distinguishes between:
    - weather_suitability: CALCULATED
    - crop_suitability: CALCULATED
    - yield_estimate: PREDICTED
    - recommendation: RECOMMENDED
    """

    class ResultType(models.TextChoices):
        WEATHER_SUITABILITY = "weather_suitability", "Weather Suitability"
        CROP_SUITABILITY = "crop_suitability", "Crop Suitability"
        YIELD_ESTIMATE = "yield_estimate", "Yield Estimate"
        RECOMMENDATION = "recommendation", "Recommendation"

    result_type = models.CharField(
        max_length=30,
        choices=ResultType.choices,
        help_text="Type of intelligence result.",
    )

    farm = models.ForeignKey(
        "farms.Farm",
        on_delete=models.CASCADE,
        related_name="intelligence_results",
        help_text="Farm this result applies to.",
    )

    crop = models.ForeignKey(
        "crops.Crop",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="intelligence_results",
        help_text="Crop this result relates to (optional).",
    )

    variety = models.ForeignKey(
        "crops.Variety",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="intelligence_results",
        help_text="Variety this result relates to (optional).",
    )

    crop_cycle = models.ForeignKey(
        "cycles.CropCycle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="intelligence_results",
        help_text="Crop cycle this result relates to (optional).",
    )

    generated_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_intelligence",
        help_text="User or system that generated this result.",
    )

    data_classification = models.CharField(
        max_length=20,
        help_text="observed | calculated | predicted | recommended",
    )

    # Core result data as JSON
    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Suitability score (0-100) or confidence score.",
    )

    value = models.JSONField(
        null=True,
        blank=True,
        help_text="Result value (e.g. yield estimate, action text).",
    )

    confidence = models.DecimalField(
        max_digits=4,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Confidence in the result (0.000-1.000).",
    )

    factors = models.JSONField(
        null=True,
        blank=True,
        help_text="Factors that contributed to the result.",
    )

    explanation = models.TextField(
        blank=True,
        default="",
        help_text="Human-readable explanation of how the result was generated.",
    )

    model_name = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Name of the model or algorithm used (e.g. 'baseline_yield').",
    )

    # Provenance
    input_data_snapshot = models.JSONField(
        null=True,
        blank=True,
        help_text="Snapshot of input data used to generate the result.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "intelligence result"
        verbose_name_plural = "intelligence results"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["farm", "result_type", "created_at"]),
            models.Index(fields=["crop", "result_type", "created_at"]),
            models.Index(fields=["data_classification"]),
            models.Index(fields=["confidence"]),
        ]

    def __str__(self) -> str:
        return f"{self.result_type} for {self.farm.name} ({self.data_classification})"

    @property
    def is_observed(self) -> bool:
        return self.data_classification == "observed"

    @property
    def is_calculated(self) -> bool:
        return self.data_classification == "calculated"

    @property
    def is_predicted(self) -> bool:
        return self.data_classification == "predicted"

    @property
    def is_recommended(self) -> bool:
        return self.data_classification == "recommended"
