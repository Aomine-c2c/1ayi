"""
AYIS — entry point for WSGI servers (Gunicorn, uWSGI).
"""

import os
import sys

from ayis.settings import SETTINGS_MODULE  # noqa: F401

os.environ.setdefault("DJANGO_SETTINGS_MODULE", SETTINGS_MODULE)

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
