#!/bin/bash
# Start backend container and wait for Django to be ready.
set -e

cd /home/sila/ayi-system

# Ensure clean state (stop old containers if any)
sudo docker compose stop backend backend-worker 2>/dev/null || true

echo "=== Starting backend container ==="
# Use background mode to avoid the long-running process detection
sudo docker compose up -d --no-deps --force-recreate backend 2>&1

echo "=== Waiting for Django to be ready ==="
READY=0
for i in $(seq 1 40); do
    if sudo docker compose exec -T backend python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']='ayis.settings'; os.environ['DEBUG']='true'; import django; django.setup(); print('django ready')" 2>/dev/null; then
        echo "Django ready (attempt $i)."
        READY=1
        break
    fi
    sleep 2
done

if [ "$READY" -eq 0 ]; then
    echo "Backend failed to start within 80 seconds."
    echo "=== Last 60 lines of backend logs ==="
    sudo docker compose logs backend 2>&1 | tail -60
    exit 1
fi

echo "=== Backend is UP and Django is ready ==="
exit 0
