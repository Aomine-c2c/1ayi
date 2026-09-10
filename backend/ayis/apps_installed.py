"""
AYIS — central registry of all AYIS Django apps.

Single source of truth for INSTALLED_APPS so settings/base.py
never drifts from the actual app set.
"""
from pathlib import Path

# Every Django app under ayis/ that contributes models, views, or
# other Django registry entries. Keep this list in sync with the
# physical app directories.
AYIS_APPS = [
    "ayis.users",
    "ayis.farms",
    "ayis.crops",
    "ayis.cycles",
    "ayis.weather",
    "ayis.intelligence",
    "ayis.production",
    "ayis.reports",
    "ayis.notifications",
    "ayis.audit",
    "ayis.settings_manager",
    "ayis.base",
    "ayis.integrations",
    "ayis.api",
    "ayis.security",
    "ayis.management",
]
