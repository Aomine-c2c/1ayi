"""
AYIS — integration base.

Defines the contract that all external integration clients must satisfy.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class ObservationRecord:
    """Normalized weather observation returned by integration clients."""

    source: str
    observed_at: datetime
    latitude: float
    longitude: float
    temperature_celsius: float | None = None
    rainfall_mm: float | None = None
    humidity_percent: float | None = None
    wind_speed_ms: float | None = None
    data_quality: str = "unknown"
    raw_payload: dict[str, Any] | None = None


class BaseIntegrationClient(ABC):
    """
    Contract for external integration clients.

    Implementations:
      - WeatherClient (Open-Meteo, etc.)
      - Future: satellite, IoT sensors, market data
    """

    @abstractmethod
    def health_check(self) -> bool:
        """Return True if the external service is reachable."""

    @abstractmethod
    def fetch_current(self, latitude: float, longitude: float) -> ObservationRecord:
        """Fetch current weather observation for a location."""

    @abstractmethod
    def fetch_historical(
        self, latitude: float, longitude: float,
        start: datetime, end: datetime
    ) -> list[ObservationRecord]:
        """Fetch historical observations for a location and time range."""

    @abstractmethod
    def fetch_forecast(
        self, latitude: float, longitude: float,
        hours: int = 24
    ) -> list[ObservationRecord]:
        """Fetch forecast observations for a location."""
