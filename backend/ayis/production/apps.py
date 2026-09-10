"""
AYIS production app configuration.
"""

from django.apps import AppConfig


class ProductionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.production"
    verbose_name = "Production"
