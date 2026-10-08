#!/usr/bin/env bash
# ==============================================================================
# AYIS Frontend Launcher (Vanilla HTML5 / CSS / ES6 JavaScript)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
REQUESTED_PORT="${1:-8080}"

# Windows / Git Bash / MSYS detection:
case "$(uname -s)" in
    CYGWIN*|MINGW*|MSYS*)
        PS_SCRIPT_PATH="$SCRIPT_DIR/run-frontend.ps1"
        if command -v cygpath &>/dev/null; then
            PS_SCRIPT_PATH=$(cygpath -w "$SCRIPT_DIR/run-frontend.ps1")
        fi
        if command -v powershell.exe &>/dev/null; then
            exec powershell.exe -ExecutionPolicy Bypass -File "$PS_SCRIPT_PATH" -Port "$REQUESTED_PORT"
            exit $?
        elif command -v pwsh.exe &>/dev/null; then
            exec pwsh.exe -ExecutionPolicy Bypass -File "$PS_SCRIPT_PATH" -Port "$REQUESTED_PORT"
            exit $?
        fi
        ;;
esac

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

echo "--------------------------------------------------------"
echo " AYIS Frontend is ready for Multi-PC / Network Access:"
echo " -> Local:   http://localhost:$PORT"
if [ "$LAN_IP" != "127.0.0.1" ]; then
echo " -> Network: http://$LAN_IP:$PORT"
echo " (Open http://$LAN_IP:$PORT on any PC / smartphone on this Wi-Fi/LAN)"
fi
echo "--------------------------------------------------------"

if command -v python3 &>/dev/null; then
    python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$FRONTEND_DIR"
elif command -v python &>/dev/null; then
    python -m http.server "$PORT" --bind 0.0.0.0 --directory "$FRONTEND_DIR"
elif command -v npx &>/dev/null; then
    npx serve "$FRONTEND_DIR" -l "$PORT"
else
    echo "Error: Python or npx required to serve frontend."
    exit 1
fi
