"""
AYIS settings loader.

When DJANGO_SETTINGS_MODULE points to `ayis.settings` (this package's
__init__.py), we silently redirect to the appropriate environment module
(ayis.settings.dev or ayis.settings.prod).

When DJANGO_SETTINGS_MODULE points directly to an environment module,
we delegate to it and re-export all public names for convenience.

When DEBUG is not explicitly set, we default to dev for safety
(testing/development should never silently use prod settings).
"""

import os

_ENV = os.environ.get("DJANGO_SETTINGS_MODULE", "").strip()
_DEBUG = os.environ.get("DEBUG", "").lower() in ("true", "1", "yes", "test")

# If the caller asked for this package itself, redirect to the env module.
if _ENV in ("ayis.settings", "ayis.settings.__init__"):
    if _DEBUG:
        _TARGET = "ayis.settings.dev"
    else:
        _TARGET = "ayis.settings.prod"
    os.environ["DJANGO_SETTINGS_MODULE"] = _TARGET
else:
    # When no explicit module is requested, default to dev for safety.
    if not _ENV:
        _TARGET = "ayis.settings.dev"
    else:
        _TARGET = _ENV

os.environ.setdefault("DJANGO_SETTINGS_MODULE", _TARGET)

# Import the resolved target and re-export all its public names so that
# `from ayis.settings import DEBUG` works regardless of which env module
# was selected.
from importlib import import_module

_selected = import_module(os.environ["DJANGO_SETTINGS_MODULE"])
for _name in dir(_selected):
    if not _name.startswith("_"):
        globals()[_name] = getattr(_selected, _name)

# Expose the selected module so callers can introspect it.
__settings_module__ = _selected
SETTINGS_MODULE = os.environ["DJANGO_SETTINGS_MODULE"]
