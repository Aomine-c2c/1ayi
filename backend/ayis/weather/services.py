"""
AYIS weather service layer.

Orchestrates weather data ingestion from external sources via the integration
client layer. Coordinates Celery tasks, normalization, and storage.

Usage:
    from ayis.weather.services import weather_service
    obs = weather_service.sync_current_for_farm(farm)
"""

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from ayis.integrations.weather.client import get_weather_client
from ayis.integrations.base import ObservationRecord

if TYPE_CHECKING:
    from ayis.farms.models import Farm


class WeatherService:
    """
    Stateless service for weather operations.

    Coordinates external weather API calls and normalizes results into
    ObservationRecord objects. Persists observations via the weather app's
    data access layer.
    """

    def __init__(self, client=None):
        self._client = client or get_weather_client()

    def sync_current_for_farm(self, farm) -> ObservationRecord | None:
        """
        Fetch and persist current weather for a farm's location.

        Returns the normalized observation, or None if the farm has no location.
        """
        if not farm.location:
            return None
        return self.sync_current_for_coordinates(
            farm.location.y, farm.location.x, source=farm.owner.username
        )

    def sync_current_for_coordinates(
        self, latitude: float, longitude: float, source: str = "system"
    ) -> ObservationRecord | None:
        """Fetch current weather for arbitrary coordinates."""
        try:
            observation = self._client.fetch_current(latitude, longitude)
            observation.source = source
            # Persist via data access layer (weather app)
            from ayis.weather.models import WeatherObservation
            WeatherObservation.objects.update_or_create(
                source=observation.source,
                observed_at=observation.observed_at,
                latitude=observation.latitude,
                longitude=observation.longitude,
                defaults={
                    "temperature_celsius": observation.temperature_celsius,
                    "rainfall_mm": observation.rainfall_mm,
                    "humidity_percent": observation.humidity_percent,
                    "wind_speed_ms": observation.wind_speed_ms,
                    "data_quality": observation.data_quality,
                },
            )
            return observation
        except Exception:
            return None

    def sync_historical_for_farm(
        self, farm, days: int = 30
    ) -> list[ObservationRecord]:
        """Fetch and persist historical weather for a farm's location."""
        if not farm.location:
            return []
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        return self.sync_historical_for_coordinates(
            farm.location.y, farm.location.x, start, end
        )

    def sync_historical_for_coordinates(
        self, latitude: float, longitude: float,
        start: datetime, end: datetime
    ) -> list[ObservationRecord]:
        """Fetch and persist historical weather for arbitrary coordinates."""
        try:
            records = self._client.fetch_historical(latitude, longitude, start, end)
            from ayis.weather.models import WeatherObservation
            for obs in records:
                WeatherObservation.objects.update_or_create(
                    source=obs.source,
                    observed_at=obs.observed_at,
                    latitude=obs.latitude,
                    longitude=obs.longitude,
                    defaults={
                        "temperature_celsius": obs.temperature_celsius,
                        "rainfall_mm": obs.rainfall_mm,
                        "humidity_percent": obs.humidity_percent,
                        "wind_speed_ms": obs.wind_speed_ms,
                        "data_quality": obs.data_quality,
                    },
                )
            return records
        except Exception:
            return []

    def fetch_current_raw(
        self, latitude: float, longitude: float
    ) -> ObservationRecord | None:
        """Fetch current weather without persisting (for API responses)."""
        try:
            return self._client.fetch_current(latitude, longitude)
        except Exception:
            return None


# Singleton service instance for import convenience
weather_service = WeatherService()
