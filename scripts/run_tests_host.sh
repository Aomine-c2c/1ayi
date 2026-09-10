#!/bin/bash
# Run Django test suite using the host venv (which has GDAL + all deps)
# connecting to the Docker PostGIS database.
set -e

source /home/sila/ayi-venv/bin/activate

cd /home/sila/ayi-system/backend

export DEBUG=true
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ayis
export DB_USER=ayis
export DB_PASSWORD=ayis-dev-password
export DB_ENGINE=django.contrib.gis.db.backends.postgis
export SECRET_KEY=test-secret-for-testing
export REDIS_URL=redis://localhost:6379/0
export ALLOWED_HOSTS=*

echo "=== Running Django test suite (host venv → Docker DB) ==="
echo "DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
echo "DEBUG=$DEBUG"
echo "DB_HOST=$DB_HOST"

python manage.py test ayi_system_tests \
    --verbosity=2 \
    --keepdb \
    2>&1

EXIT=$?
echo ""
echo "=== Test run complete (exit code: $EXIT) ==="
exit $EXIT
