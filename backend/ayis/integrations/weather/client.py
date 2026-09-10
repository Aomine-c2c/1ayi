"""
AYIS — weather integration.

WeatherClient is the adapter for external weather APIs.
Currently implements Open-Meteo (free, no API key required).

The client normalizes responses into ObservationRecord so the rest of
the system is decoupled from the provider's response shape.
"""

from datetime import datetime, timezone
from typing import Any

import requests

from ayis.integrations.base import BaseIntegrationClient, ObservationRecord


class WeatherClient(BaseIntegrationClient):
    """
    Weather integration client.

    Default provider: Open-Meteo (https://open-meteo.com/).
    Open-Meteo requires no API key for basic usage and provides
    current weather, historical observations, and forecasts.

    Configuration via environment variables:
      WEATHER_SOURCE            — provider name (default: "open-meteo")
      OPEN_METEO_API_BASE_URL  — override base URL (default: https://api.open-meteo.com/v1)
    """

    SOURCE_NAME = "open-meteo"

    def __init__(self):
        self._session: requests.Session | None = None
        self._base_url = (
            self._get_env("OPEN_METEO_API_BASE_URL")
            or "https://api.open-meteo.com/v1"
        )

    def _get_env(self, key: str) -> str | None:
        import os
        return os.environ.get(key)

    @property
    def session(self) -> requests.Session:
        if self._session is None:
            self._session = requests.Session()
            self._session.headers.update({
                "User-Agent": "AYIS-WeatherClient/1.0",
                "Accept": "application/json",
            })
        return self._session

    def health_check(self) -> bool:
        try:
            resp = self.session.get(f"{self._base_url}/models", timeout=10)
            return resp.status_code == 200
        except Exception:
            return False

    def fetch_current(self, latitude: float, longitude: float) -> ObservationRecord:
        """
        Fetch current weather from Open-Meteo.

        Returns a normalized ObservationRecord.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": (
                "temperature_2m,relative_humidity_2m,"
                "precipitation,weather_code,wind_speed_10m"
            ),
            "timezone": "auto",
        }
        resp = self.session.get(f"{self._base_url}/weather", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current", {})
        raw = data

        return ObservationRecord(
            source=self.SOURCE_NAME,
            observed_at=datetime.now(timezone.utc),
            latitude=latitude,
            longitude=longitude,
            temperature_celsius=self._to_float(current.get("temperature_2m")),
            humidity_percent=self._to_float(current.get("relative_humidity_2m")),
            rainfall_mm=self._to_float(current.get("precipitation")),
            wind_speed_ms=self._to_float(current.get("wind_speed_10m")),
            data_quality="good" if current else "no_data",
            raw_payload=raw,
        )

    def fetch_historical(
        self, latitude: float, longitude: float,
        start: datetime, end: datetime
    ) -> list[ObservationRecord]:
        """
        Fetch historical daily weather from Open-Meteo.

        Returns one ObservationRecord per day (approximated to noon UTC).
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
            "daily": (
                "temperature_2m_max,temperature_2m_min,"
                "precipitation_sum,weather_code,"
                "wind_speed_10m_max"
            ),
            "timezone": "auto",
        }
        resp = self.session.get(f"{self._base_url}/historical", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        daily = data.get("daily", {})
        records = []
        dates = daily.get("time", [])
        if not dates:
            return records

        for i, date_str in enumerate(dates):
            raw_day = {
                "date": date_str,
                "temperature_max": daily.get("temperature_2m_max", [None])[i],
                "temperature_min": daily.get("temperature_2m_min", [None])[i],
                "precipitation": daily.get("precipitation_sum", [None])[i],
                "weather_code": daily.get("weather_code", [None])[i],
                "wind_speed_max": daily.get("wind_speed_10m_max", [None])[i],
            }
            obs_time = datetime.strptime(date_str, "%Y-%m-%d").replace(
                hour=12, tzinfo=timezone.utc
            )
            records.append(ObservationRecord(
                source=self.SOURCE_NAME,
                observed_at=obs_time,
                latitude=latitude,
                longitude=longitude,
                temperature_celsius=raw_day["temperature_max"],
                rainfall_mm=raw_day["precipitation"],
                humidity_percent=None,
                wind_speed_ms=raw_day["wind_speed_max"],
                data_quality="good" if raw_day["temperature_max"] is not None else "no_data",
                raw_payload=raw_day,
            ))
        return records

    def fetch_forecast(
        self, latitude: float, longitude: float,
        hours: int = 24
    ) -> list[ObservationRecord]:
        """
        Fetch weather forecast from Open-Meteo.

        Returns hourly forecast observations.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": (
                "temperature_2m,relative_humidity_2m,"
                "precipitation_probability,weather_code,"
                "wind_speed_10m"
            ),
            "forecast_hours": min(hours, 168),  # max 7 days
            "timezone": "auto",
        }
        resp = self.session.get(f"{self._base_url}/forecast", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly", {})
        records = []
        times = hourly.get("time", [])
        if not times:
            return records

        for i, time_str in enumerate(times[:hours]):
            raw_hour = {
                "time": time_str,
                "temperature": hourly.get("temperature_2m", [None])[i],
                "humidity": hourly.get("relative_humidity_2m", [None])[i],
                "precipitation_prob": hourly.get("precipitation_probability", [None])[i],
                "weather_code": hourly.get("weather_code", [None])[i],
                "wind_speed": hourly.get("wind_speed_10m", [None])[i],
            }
            obs_time = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            records.append(ObservationRecord(
                source=self.SOURCE_NAME,
                observed_at=obs_time,
                latitude=latitude,
                longitude=longitude,
                temperature_celsius=raw_hour["temperature"],
                rainfall_mm=None,
                humidity_percent=raw_hour["humidity"],
                wind_speed_ms=raw_hour["wind_speed"],
                data_quality="forecast",
                raw_payload=raw_hour,
            ))
        return records

    @staticmethod
    def _to_float(value: Any) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None


def get_weather_client() -> WeatherClient:
    """Factory for the weather client singleton."""
    return WeatherClient()
