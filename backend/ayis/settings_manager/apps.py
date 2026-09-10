"""
AYIS settings_manager app configuration.
"""

from django.apps import AppConfig


class SettingsManagerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.settings_manager"
    verbose_name = "Settings"
