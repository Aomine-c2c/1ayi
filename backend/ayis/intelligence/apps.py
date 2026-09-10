"""
AYIS intelligence app configuration.
"""

from django.apps import AppConfig


class IntelligenceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.intelligence"
    verbose_name = "Intelligence"
