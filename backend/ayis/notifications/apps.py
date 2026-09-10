"""
AYIS notifications app configuration.
"""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.notifications"
    verbose_name = "Notifications"
