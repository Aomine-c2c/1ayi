"""
AYIS crops app configuration.
"""

from django.apps import AppConfig


class CropsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.crops"
    verbose_name = "Crops"
