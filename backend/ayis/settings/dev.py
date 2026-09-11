"""
AYIS — settings dev overrides.

Local development. Do NOT use in production.
"""

from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

# Detect if PostGIS/GDAL is unavailable on the local host (e.g. running outside Docker without OS GDAL)
try:
    from django.contrib.gis import gdal
except Exception:
    # Fallback to local SQLite for rapid local host development/testing without Docker
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
    if "django.contrib.gis" in INSTALLED_APPS:
        INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django.contrib.gis"]
else:
    DATABASES["default"]["CONN_MAX_AGE"] = 0

CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "true").lower() in (
    "true", "1", "yes"
)
SPECTACULAR_SETTINGS["SERVE_PUBLIC"] = True
