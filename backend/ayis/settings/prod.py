"""
AYIS — settings prod overrides.

Production deployment. Assumes HTTPS termination at a reverse proxy.
"""

from django.core.exceptions import ImproperlyConfigured
from .base import *  # noqa: F401, F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")
if not ALLOWED_HOSTS or ALLOWED_HOSTS == [""]:
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS must be set in production via the ALLOWED_HOSTS env var."
    )

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CORS_ALLOW_ALL_ORIGINS = False
STATIC_ROOT = BASE_DIR / "staticfiles"
CELERY_TASK_ALWAYS_EAGER = False
