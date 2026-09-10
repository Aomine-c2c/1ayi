"""
AYIS — ASGI entry point (used for potential async endpoints / channels).
"""

import os
import sys

from ayis.settings import SETTINGS_MODULE  # noqa: F401

os.environ.setdefault("DJANGO_SETTINGS_MODULE", SETTINGS_MODULE)

from django.core.asgi import get_asgi_application  # noqa: E402

application = get_asgi_application()
