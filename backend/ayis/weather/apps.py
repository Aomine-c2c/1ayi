"""
AYIS weather app configuration.
"""

from django.apps import AppConfig


class WeatherConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.weather"
    verbose_name = "Weather"
