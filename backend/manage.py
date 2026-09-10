import os
import sys

from ayis.settings import SETTINGS_MODULE

os.environ.setdefault("DJANGO_SETTINGS_MODULE", SETTINGS_MODULE)

from django.core.management import execute_from_command_line  # noqa: E402

if __name__ == "__main__":
    execute_from_command_line(sys.argv)
