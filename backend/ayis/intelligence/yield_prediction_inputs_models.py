"""
AYIS yield prediction inputs — provenance for yield estimates.

When a yield estimate is generated, the inputs used (weather snapshot,
soil data, crop parameters, assumptions) are recorded here so the
prediction is reproducible and auditable. Linked to IntelligenceResult.

NOTE: Uses TYPE_CHECKING + string references to avoid circular imports
with intelligence/models.py during Django app registry population.
"""

from __future__ import annotations

from django.db import models
from django.conf import settings
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ayis.intelligence.models import IntelligenceResult
    from ayis.farms.models import Farm
    from ayis.users.models import User


class YieldPredictionInputs(models.Model):
    """
    The inputs used to generate a specific yield prediction.

    This is the provenance record for a yield estimate. It captures
    the weather data, soil properties, crop variety, planting details,
    and model assumptions so the prediction can be reproduced or audited.
    """

    intelligence_result = models.ForeignKey(
        'intelligence.IntelligenceResult',
        on_delete=models.CASCADE,
        related_name='prediction_inputs',
        help_text='The yield estimate this input set produced.',
    )

    farm = models.ForeignKey(
        'farms.Farm',
        on_delete=models.CASCADE,
        related_name='yield_prediction_inputs',
        help_text='Farm this prediction was for.',
    )

    # Weather inputs — snapshot of weather data used
    weather_period_start = models.DateField(
        null=True,
        blank=True,
        help_text='Start of weather period used for prediction.',
    )
    weather_period_end = models.DateField(
        null=True,
        blank=True,
        help_text='End of weather period used for prediction.',
    )
    weather_source = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Weather data source (e.g. open-meteo, demo_weather).',
    )
    weather_observation_count = models.PositiveIntegerField(
        default=0,
        help_text='Number of weather observations used.',
    )

    # Crop inputs
    crop_name = models.CharField(
        max_length=100,
        help_text='Crop name at time of prediction.',
    )
    variety_name = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Crop variety at time of prediction.',
    )
    variety_code = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Variety code/breeder designation.',
    )
    planting_date = models.DateField(
        help_text='Date the crop was planted.',
    )
    expected_harvest_date = models.DateField(
        null=True,
        blank=True,
        help_text='Expected harvest date.',
    )

    # Farm parameters
    farm_area_ha = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        help_text='Farm area in hectares at time of prediction.',
    )
    soil_type = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Soil type classification.',
    )
    soil_ph = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        default=None,
        help_text='Soil pH.',
    )
    soil_organic_matter_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        default=None,
        help_text='Soil organic matter percentage.',
    )

    # Input assumptions
    planting_density_plants_per_ha = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=None,
        help_text='Planting density used in prediction.',
    )
    irrigation_assumption_mm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        default=None,
        help_text='Assumed irrigation amount in mm.',
    )
    fertilizer_nitrogen_kg_ha = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        default=None,
        help_text='Assumed nitrogen fertilizer input (kg/ha).',
    )
    fertilizer_phosphorus_kg_ha = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        default=None,
        help_text='Assumed phosphorus fertilizer input (kg/ha).',
    )
    fertilizer_potassium_kg_ha = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        default=None,
        help_text='Assumed potassium fertilizer input (kg/ha).',
    )

    # Model details
    model_name = models.CharField(
        max_length=100,
        help_text='Name of the yield prediction model used.',
    )
    model_version = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text='Model version or revision.',
    )
    model_parameters = models.JSONField(
        null=True,
        blank=True,
        help_text='Model-specific parameters used.',
    )

    # Confidence and quality
    input_quality_rating = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor'),
        ],
        default='good',
        help_text='Overall quality rating of the input data.',
    )
    data_gaps = models.TextField(
        blank=True,
        default='',
        help_text='Description of any data gaps or limitations.',
    )

    # Provenance
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='yield_prediction_inputs_created',
        help_text='User who created this input record.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'yield prediction inputs'
        verbose_name_plural = 'yield prediction inputs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['farm', 'crop_name', 'created_at']),
            models.Index(fields=['intelligence_result']),
            models.Index(fields=['model_name', 'created_at']),
        ]

    def __str__(self) -> str:
        return (
            f"Yield inputs: {self.crop_name} on {self.farm.name} "
            f"({self.model_name} v{self.model_version})"
        )
