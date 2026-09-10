"""
AYIS management commands app.
Registers the seed_data management command.
"""
from django.apps import AppConfig


class AyisManagementConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ayis.management"
    verbose_name = "AYIS Management Commands"

    def ready(self):
        # Import management commands to register them with Django.
        # This triggers the import of ayis.management.commands.* modules.
        from ayis.management import commands  # noqa: F401

