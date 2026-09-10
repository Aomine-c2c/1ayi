"""
AYIS cycles app configuration.
"""

from django.apps import AppConfig


class CyclesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.cycles"
    verbose_name = "Crop Cycles"
