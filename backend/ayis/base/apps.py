"""
AYIS base app configuration.

Provides shared model mixins (timestamps, created_by, soft_delete).
"""

from django.apps import AppConfig


class BaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.base"
    verbose_name = "Base"
