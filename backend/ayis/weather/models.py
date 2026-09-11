"""
AYIS weather models.

Weather data is OBSERVED (observations) or PREDICTED (forecasts).
"""

from django.db import models
from ayis.base.geo_compat import geo_models


class WeatherSource(models.Model):
    """A weather data provider (e.g. Open-Meteo, national meteorological service)."""

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Human-readable source name.",
    )
    provider = models.CharField(
        max_length=50,
        help_text="Provider identifier (e.g. 'open-meteo', 'nasa-power').",
    )
    api_endpoint = models.URLField(
        blank=True,
        default="",
        help_text="API endpoint URL if applicable.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this source is currently active.",
    )
    priority = models.SmallIntegerField(
        default=10,
        help_text="Priority for data ingestion (lower = higher priority).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "weather source"
        verbose_name_plural = "weather sources"
        ordering = ["priority", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.provider})"


class WeatherObservation(models.Model):
    """
    A single weather observation — OBSERVED data from an external source.

    Includes current and historical observations.
    """

    source = models.ForeignKey(
        WeatherSource,
        on_delete=models.PROTECT,
        related_name="observations",
        help_text="Weather source that provided this observation.",
    )

    observed_at = models.DateTimeField(
        db_index=True,
        help_text="Timestamp of the observation.",
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitude of the observation location.",
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitude of the observation location.",
    )

    # Optional PostGIS point for spatial queries
    location = geo_models.PointField(
        srid=4326,
        null=True,
        blank=True,
        help_text="PostGIS point for spatial queries.",
    )

    temperature_celsius = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Temperature in Celsius.",
    )

    rainfall_mm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Rainfall in mm (for the observation period).",
    )

    humidity_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Relative humidity percentage.",
    )

    wind_speed_ms = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Wind speed in meters per second.",
    )

    pressure_hpa = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Atmospheric pressure in hPa.",
    )

    data_quality = models.CharField(
        max_length=20,
        default="unknown",
        help_text="Data quality indicator: good, fair, poor, no_data, forecast.",
    )

    raw_payload = models.JSONField(
        null=True,
        blank=True,
        help_text="Original API response payload for provenance.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "weather observation"
        verbose_name_plural = "weather observations"
        ordering = ["-observed_at"]
        indexes = [
            models.Index(fields=["observed_at"]),
            models.Index(fields=["latitude", "longitude", "observed_at"]),
            models.Index(fields=["source", "observed_at"]),
        ]
        unique_together = [
            ["source", "observed_at", "latitude", "longitude"]
        ]

    def __str__(self) -> str:
        return f"{self.source.name} @ {self.observed_at.isoformat()} ({self.latitude}, {self.longitude})"

    def save(self, *args, **kwargs):
        if self.location is None and self.latitude is not None and self.longitude is not None:
            from ayis.base.geo_compat import Point
            self.location = Point(float(self.longitude), float(self.latitude), srid=4326)
        super().save(*args, **kwargs)


class WeatherForecast(models.Model):
    """
    A weather forecast entry — PREDICTED data from an external forecast service.
    """

    source = models.ForeignKey(
        WeatherSource,
        on_delete=models.PROTECT,
        related_name="forecasts",
        help_text="Weather source that provided this forecast.",
    )

    forecast_at = models.DateTimeField(
        db_index=True,
        help_text="Timestamp when the forecast was issued.",
    )

    forecast_for = models.DateTimeField(
        db_index=True,
        help_text="Timestamp the forecast is for.",
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitude of the forecast location.",
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitude of the forecast location.",
    )

    location = geo_models.PointField(
        srid=4326,
        null=True,
        blank=True,
        help_text="PostGIS point for spatial queries.",
    )

    temperature_celsius = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    rainfall_probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Probability of precipitation (0-100%).",
    )

    rainfall_mm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )

    humidity_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    wind_speed_ms = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )

    weather_code = models.CharField(
        max_length=10,
        blank=True,
        default="",
        help_text="Weather condition code from the source.",
    )

    data_quality = models.CharField(
        max_length=20,
        default="forecast",
        help_text="Data quality indicator.",
    )

    raw_payload = models.JSONField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "weather forecast"
        verbose_name_plural = "weather forecasts"
        ordering = ["forecast_for"]
        indexes = [
            models.Index(fields=["forecast_for"]),
            models.Index(fields=["latitude", "longitude", "forecast_for"]),
        ]

    def __str__(self) -> str:
        return f"Forecast for {self.forecast_for.isoformat()} @ ({self.latitude}, {self.longitude})"

    def save(self, *args, **kwargs):
        if self.location is None and self.latitude is not None and self.longitude is not None:
            from ayis.base.geo_compat import Point
            self.location = Point(float(self.longitude), float(self.latitude), srid=4326)
        super().save(*args, **kwargs)


class WeatherSyncJob(models.Model):
    """
    Record of a weather data synchronization job.

    Tracks background weather ingestion runs for monitoring and debugging.
    """

    source = models.ForeignKey(
        WeatherSource,
        on_delete=models.CASCADE,
        related_name="sync_jobs",
    )

    started_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the sync job started.",
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the sync job completed (null if still running).",
    )

    status = models.CharField(
        max_length=20,
        default="pending",
        help_text="Job status: pending, running, completed, failed.",
    )

    records_processed = models.PositiveIntegerField(
        default=0,
        help_text="Number of weather records processed.",
    )

    records_created = models.PositiveIntegerField(
        default=0,
        help_text="Number of new observations created.",
    )

    records_updated = models.PositiveIntegerField(
        default=0,
        help_text="Number of existing observations updated.",
    )

    error_message = models.TextField(
        blank=True,
        default="",
        help_text="Error message if the job failed.",
    )

    class Meta:
        verbose_name = "weather sync job"
        verbose_name_plural = "weather sync jobs"
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"Sync job {self.source.name} — {self.status} ({self.records_processed} records)"
