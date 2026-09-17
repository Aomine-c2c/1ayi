#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/backend/Ayis.Api"

echo "=========================================="
echo "   Starting AYIS C# Backend (.NET)        "
echo "=========================================="

REQUESTED_PORT="${1:-8000}"

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

export ASPNETCORE_URLS="http://localhost:$PORT"
export ASPNETCORE_ENVIRONMENT="Development"

cd "$API_DIR"
echo "Restoring NuGet packages..."
dotnet restore

echo "Launching AYIS Minimal API on http://localhost:$PORT..."
echo "Swagger API spec available at: http://localhost:$PORT/swagger/v1/swagger.json"

dotnet run
