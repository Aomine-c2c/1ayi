#!/bin/bash
# Run Django test suite via the backend container
set -e
cd /home/sila/ayi-system

# Start all services
sudo docker compose up -d 2>&1

# Wait for backend readiness
echo "Waiting for backend container to start..."
for i in $(seq 1 30); do
    if sudo docker compose ps --format json 2>/dev/null | grep -q '"State":"running"'; then
        echo "Container is running."
        break
    fi
    sleep 2
done

# Check if it's actually serving
sleep 3
sudo docker compose ps 2>&1
