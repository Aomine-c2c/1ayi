#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
REQUESTED_PORT="${1:-8080}"

# Determine available port starting from requested port
find_available_port() {
    local start_port="$1"
    if command -v python3 &>/dev/null; then
        python3 -c "
import socket
p = $start_port
while p < $start_port + 100:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if s.connect_ex(('127.0.0.1', p)) != 0:
            print(p)
            break
    p += 1
"
    else
        echo "$start_port"
    fi
}

PORT=$(find_available_port "$REQUESTED_PORT")
if [ "$PORT" != "$REQUESTED_PORT" ]; then
    echo "Notice: Port $REQUESTED_PORT is in use. Automatically switched to port $PORT."
fi

echo "=========================================="
echo "   Starting AYIS Frontend (Vanilla Web)   "
echo "=========================================="

if command -v python3 &>/dev/null; then
    echo "Serving frontend via Python 3 on http://localhost:$PORT..."
    python3 -m http.server "$PORT" --directory "$FRONTEND_DIR"
elif command -v python &>/dev/null; then
    echo "Serving frontend via Python on http://localhost:$PORT..."
    python -m http.server "$PORT" --directory "$FRONTEND_DIR"
elif command -v npx &>/dev/null; then
    echo "Serving frontend via npx serve on http://localhost:$PORT..."
    npx serve "$FRONTEND_DIR" -l "$PORT"
else
    echo "Error: Python or npx required to serve frontend."
    exit 1
fi
