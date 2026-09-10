"""
AYIS audit configuration.

Registers the audit app and configures audit logging middleware.
"""

from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.audit"
    verbose_name = "Audit"
