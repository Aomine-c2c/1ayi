"""
AYIS — settings dev overrides.

Local development. Do NOT use in production.
"""

from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True
DATABASES["default"]["CONN_MAX_AGE"] = 0
CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "true").lower() in (
    "true", "1", "yes"
)
SPECTACULAR_SETTINGS["SERVE_PUBLIC"] = True
