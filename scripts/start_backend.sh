#!/bin/bash
# Start backend container and wait for Django to be ready.
set -e

cd /home/sila/ayi-system

echo "=== Cleaning up old containers ==="
sudo docker compose stop backend backend-worker 2>/dev/null || true
sudo docker compose rm -f backend backend-worker 2>/dev/null || true

echo "=== Starting backend container ==="
sudo docker compose up -d --no-deps --force-recreate backend

echo "=== Waiting for Django to be ready (max 90s) ==="
READY=0
for i in $(seq 1 45); do
    if sudo docker compose exec -T backend python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']='ayis.settings'; os.environ['DEBUG']='true'; import django; django.setup(); print('django ready')" 2>/dev/null; then
        echo "Django ready (attempt $i)."
        READY=1
        break
    fi
    sleep 2
done

if [ "$READY" -eq 0 ]; then
    echo "Backend failed to start within 90 seconds."
    echo "=== Backend logs (last 80 lines) ==="
    sudo docker compose logs backend 2>&1 | tail -80
    exit 1
fi

echo "=== Backend is UP ==="
sudo docker compose ps backend
exit 0
