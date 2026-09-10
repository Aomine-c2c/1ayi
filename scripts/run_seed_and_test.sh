#!/bin/bash
# Run seed data and tests using docker compose run (one-off containers)
# This works even when the long-running backend server crashes
set -e
cd /home/sila/ayi-system

echo "=== Running migrations ==="
sudo docker compose run --rm backend python manage.py migrate --noinput 2>&1

echo ""
echo "=== Running seed data ==="
sudo docker compose run --rm backend python -c "
import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'ayis.settings.dev'
django.setup()
from ayis.seed_data import run_seed
run_seed()
" 2>&1

echo ""
echo "=== Running test suite ==="
sudo docker compose run --rm backend python manage.py test ayi_system_tests --verbosity=1 --keepdb 2>&1
