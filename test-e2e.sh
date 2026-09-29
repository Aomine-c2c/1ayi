#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "===================================================="
echo "   AYIS Automated End-to-End Browser Test Suite     "
echo "===================================================="

# Check if Playwright is accessible
if [ -d "/usr/lib/node_modules/playwright-core" ]; then
    export NODE_PATH="${NODE_PATH:-/usr/lib/node_modules}"
fi

# Ensure servers are up or start temporary instances
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    if [ -n "$BACKEND_PID" ]; then
        echo "Stopping temporary backend (PID $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        echo "Stopping temporary frontend (PID $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

# Check if backend (port 8000) is responding
if ! curl -s -f "http://localhost:8000/api/v1/health" &>/dev/null; then
    echo "Starting backend server on port 8000..."
    bash "$SCRIPT_DIR/run-backend.sh" 8000 >/dev/null 2>&1 &
    BACKEND_PID=$!
    # Wait for backend health
    for i in {1..30}; do
        if curl -s -f "http://localhost:8000/api/v1/health" &>/dev/null; then
            echo "✓ Backend ready on http://localhost:8000"
            break
        fi
        sleep 1
    done
else
    echo "✓ Using running backend on http://localhost:8000"
fi

# Check if frontend (port 8080) is responding
if ! curl -s "http://localhost:8080" &>/dev/null; then
    echo "Starting frontend server on port 8080..."
    bash "$SCRIPT_DIR/run-frontend.sh" 8080 >/dev/null 2>&1 &
    FRONTEND_PID=$!
    # Wait for frontend
    for i in {1..20}; do
        if curl -s "http://localhost:8080" &>/dev/null; then
            echo "✓ Frontend ready on http://localhost:8080"
            break
        fi
        sleep 1
    done
else
    echo "✓ Using running frontend on http://localhost:8080"
fi

echo ""
echo "Running Playwright E2E browser audit..."
node "$SCRIPT_DIR/frontend/tests/e2e/audit_runner.cjs"
EXIT_CODE=$?

exit $EXIT_CODE
