"""
AYIS — Celery application configuration.

Import this module with `celery -A ayis` to start workers.

In development (dev settings), tasks run eagerly so you don't need a running
broker to test task code.
"""

from celery import Celery
from celery.signals import setup_logging

from ayis.settings import SETTINGS_MODULE

os_env = __import__("os").environ
os_env.setdefault("DJANGO_SETTINGS_MODULE", SETTINGS_MODULE)

app = Celery("ayis")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@setup_logging.connect
def configure_logging(loglevel, logfile, **kwargs):
    """Use Django's logging configuration instead of Celery's default."""
    import logging
    from django.conf import settings

    if hasattr(settings, "LOGGING"):
        logging.config.dictConfig(settings.LOGGING)
