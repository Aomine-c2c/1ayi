import os
import sys

settings_module = os.environ.get("DJANGO_SETTINGS_MODULE") or "ayis.settings.dev"
os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

from django.core.management import execute_from_command_line  # noqa: E402

if __name__ == "__main__":
    execute_from_command_line(sys.argv)
