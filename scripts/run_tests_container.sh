#!/bin/bash
# Run Django test suite via the backend container (which has GDAL).
set -e
cd /home/sila/ayi-system
echo "=== Ensuring backend container is running ==="
sudo docker compose up -d 2>&1 | tail -3
echo "=== Waiting for container readiness ==="
for i in $(seq 1 30); do
    if sudo docker compose exec -T backend python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']='ayis.settings'; os.environ['DEBUG']='true'; import django; django.setup(); print('READY')" 2>/dev/null; then
        echo "Backend ready."
        break
    fi
    sleep 2
done
echo "=== Running tests ==="
sudo docker compose exec -T backend bash -c "
export DEBUG=true
export DB_HOST=db
export DB_PASSWORD=ayis-dev-password
export DB_USER=ayis
export DB_NAME=ayis
export SECRET_KEY=test-key
export REDIS_URL=redis://redis:6379/0
export ALLOWED_HOSTS=*
cd /app
python manage.py test ayi_system_tests --verbosity=2 --keepdb 2>&1
"