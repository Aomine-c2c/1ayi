#!/usr/bin/env bash
# ==============================================================================
# AYIS Backend Launcher (C# ASP.NET Core 8 Minimal API)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/backend/Ayis.Api"

if [ -d "$HOME/.dotnet" ]; then
    export DOTNET_ROOT="$HOME/.dotnet"
    export PATH="$HOME/.dotnet:$PATH"
fi
if [ -d "/usr/local/share/dotnet" ]; then
    export PATH="/usr/local/share/dotnet:$PATH"
fi

echo "=========================================="
echo "   Starting AYIS C# Backend (.NET 8)      "
echo "=========================================="

REQUESTED_PORT="${1:-5050}"

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

get_lan_ip() {
    if command -v ip &>/dev/null; then
        ip -4 addr show scope global | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1 2>/dev/null || echo "127.0.0.1"
    elif command -v ifconfig &>/dev/null; then
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1 2>/dev/null || echo "127.0.0.1"
    else
        echo "127.0.0.1"
    fi
}

LAN_IP=$(get_lan_ip)

export ASPNETCORE_URLS="http://0.0.0.0:$PORT"
export ASPNETCORE_ENVIRONMENT="Development"

cd "$API_DIR"
echo "Restoring NuGet packages..."
dotnet restore

echo "Building AYIS Minimal API..."
dotnet build --no-restore --configuration Debug -o "$API_DIR/bin/Debug/net8.0"

echo "--------------------------------------------------------"
echo " AYIS Minimal API is ready for Multi-PC / Network Access:"
echo " -> Local:   http://localhost:$PORT"
if [ "$LAN_IP" != "127.0.0.1" ]; then
echo " -> Network: http://$LAN_IP:$PORT"
fi
echo " -> Swagger: http://localhost:$PORT/swagger"
echo "--------------------------------------------------------"

dotnet run --no-build --urls "http://0.0.0.0:$PORT"
