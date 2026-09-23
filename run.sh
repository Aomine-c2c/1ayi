#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PORT="${1:-8080}"
BACKEND_PORT="${2:-8000}"

echo "=========================================="
echo "       AYIS Unified System Runner         "
echo "=========================================="

free_port() {
    local port="$1"
    if command -v fuser &>/dev/null; then
        fuser -k "${port}/tcp" 2>/dev/null || true
    else
        local pids
        pids=$(ss -tulpn 2>/dev/null | grep ":${port} " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
        if [ -n "$pids" ]; then
            for pid in $pids; do
                kill -9 "$pid" 2>/dev/null || true
            done
        fi
    fi
}

cleanup() {
    echo ""
    echo "Stopping AYIS services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    free_port "$BACKEND_PORT"
    free_port "$FRONTEND_PORT"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Auto-free ports if previous runs were orphaned
free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

# 1. Start Backend in background
echo "1. Starting C# ASP.NET Core Backend on http://localhost:$BACKEND_PORT..."
"$SCRIPT_DIR/run-backend.sh" "$BACKEND_PORT" &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend API..."
for i in {1..30}; do
    if curl -s "http://localhost:$BACKEND_PORT/api/v1/health" >/dev/null 2>&1; then
        echo "-> Backend is ready at http://localhost:$BACKEND_PORT (Swagger: /swagger/v1/swagger.json)"
        break
    fi
    sleep 0.5
done

# 2. Start Frontend
echo ""
echo "2. Starting Vanilla Frontend (default: http://localhost:$FRONTEND_PORT)..."
echo "Press Ctrl+C to stop both backend and frontend."
echo "=========================================="

"$SCRIPT_DIR/run-frontend.sh" "$FRONTEND_PORT"
