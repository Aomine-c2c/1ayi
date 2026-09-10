#!/bin/bash
# Run Django test suite inside the backend Docker container.
# Uses docker exec so no sudo is needed for the test runner itself.
set -e

echo "=== Ensuring backend container is running ==="
cd /home/sila/ayi-system

# Check if backend container exists and is running
if sudo docker compose ps backend 2>/dev/null | grep -q "Up"; then
    echo "Backend container is already running."
else
    echo "Starting backend container..."
    sudo docker compose up -d backend 2>/dev/null
    sleep 3
fi

echo ""
echo "=== Running Django tests inside container ==="
sudo docker compose exec -T backend bash -lc '
set -e
cd /app

export DEBUG=true
export DB_HOST=db
export DB_PASSWORD=ayis-dev-password
export DB_USER=ayis
export DB_NAME=ayis
export SECRET_KEY=test-secret-for-testing
export REDIS_URL=redis://redis:6379/0
export ALLOWED_HOSTS=*

echo "DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
echo "DEBUG=$DEBUG"

python manage.py test ayi_system_tests \
    --verbosity=2 \
    --keepdb \
    2>&1
'

EXIT=$?
echo ""
echo "=== Test run complete (exit code: $EXIT) ==="
exit $EXIT
