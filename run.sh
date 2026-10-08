#!/usr/bin/env bash
# ==============================================================================
# AYIS (Agricultural Yield Production Monitoring System) — Unified System Runner
# Compatible with Linux (Ubuntu, Debian, Fedora, Arch) and macOS
# ==============================================================================
# Universal Windows detection (MSYS, MINGW, UCRT64, CYGWIN, WSL, Git Bash, etc.)
IS_WINDOWS=false
if [ -n "$COMSPEC" ] || [ "$OS" = "Windows_NT" ]; then
    IS_WINDOWS=true
fi
case "$(uname -s 2>/dev/null)" in
    CYGWIN*|MINGW*|MSYS*|Windows*)
        IS_WINDOWS=true
        ;;
esac

if [ "$IS_WINDOWS" = true ]; then
    echo "=========================================================="
    echo "       AYIS Universal Cross-Platform Runner (Windows)     "
    echo "=========================================================="
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PS_SCRIPT_PATH="$SCRIPT_DIR/run.ps1"
    if command -v cygpath &>/dev/null; then
        PS_SCRIPT_PATH=$(cygpath -w "$SCRIPT_DIR/run.ps1")
    fi
    
    # Try powershell.exe, pwsh.exe, or Windows system PowerShell
    PS_CMD=""
    if command -v powershell.exe &>/dev/null; then
        PS_CMD="powershell.exe"
    elif command -v pwsh.exe &>/dev/null; then
        PS_CMD="pwsh.exe"
    elif [ -x "/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" ]; then
        PS_CMD="/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
    fi

    if [ -n "$PS_CMD" ]; then
        echo "Auto-delegating execution to native Windows runner (run.ps1)..."
        exec "$PS_CMD" -ExecutionPolicy Bypass -File "$PS_SCRIPT_PATH" -FrontendPort "${1:-8080}" -BackendPort "${2:-5050}"
        exit $?
    fi
fi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PORT="${1:-8080}"
BACKEND_PORT="${2:-5050}"

# Include user-level .dotnet installation paths if present
if [ -d "$HOME/.dotnet" ]; then
    export DOTNET_ROOT="$HOME/.dotnet"
    export PATH="$HOME/.dotnet:$PATH"
fi
if [ -d "/usr/local/share/dotnet" ]; then
    export PATH="/usr/local/share/dotnet:$PATH"
fi

echo "=========================================================="
echo "       AYIS Universal Cross-Platform Runner               "
echo "=========================================================="

# ── Pre-flight Prerequisite Detection & Silent Installer ───────
OS_NAME="$(uname -s)"

detect_pkg_mgr() {
    if command -v apt-get &>/dev/null; then echo "apt";
    elif command -v dnf &>/dev/null; then echo "dnf";
    elif command -v pacman &>/dev/null; then echo "pacman";
    elif command -v brew &>/dev/null; then echo "brew";
    else echo "unknown";
    fi
}

PKG_MGR=$(detect_pkg_mgr)

check_dotnet() {
    echo -n "Checking .NET 8 SDK... "
    if command -v dotnet &>/dev/null; then
        local sdks
        sdks=$(dotnet --list-sdks 2>/dev/null || true)
        if echo "$sdks" | grep -q "^8\."; then
            echo "found ($(dotnet --version))"
            return 0
        fi
    fi
    echo "MISSING"

    echo "Attempting automated installation of .NET 8 SDK..."
    case "$PKG_MGR" in
        "brew")
            echo "-> Running: brew install --cask dotnet-sdk"
            brew install --cask dotnet-sdk || true
            ;;
        "apt")
            echo "-> Running: sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0"
            if command -v sudo &>/dev/null; then
                sudo apt-get update -qq && sudo apt-get install -y -qq dotnet-sdk-8.0 || true
            fi
            ;;
        "dnf")
            echo "-> Running: sudo dnf install -y dotnet-sdk-8.0"
            if command -v sudo &>/dev/null; then
                sudo dnf install -y -q dotnet-sdk-8.0 || true
            fi
            ;;
        "pacman")
            echo "-> Running: sudo pacman -S --noconfirm dotnet-sdk-8.0"
            if command -v sudo &>/dev/null; then
                sudo pacman -S --noconfirm dotnet-sdk-8.0 || true
            fi
            ;;
        *)
            ;;
    esac

    # Check if Microsoft dotnet-install script fallback is available
    if ! command -v dotnet &>/dev/null || ! dotnet --list-sdks 2>/dev/null | grep -q "^8\."; then
        if command -v curl &>/dev/null; then
            echo "Downloading and running official dotnet-install.sh..."
            curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 8.0 --install-dir "$HOME/.dotnet" || true
            export DOTNET_ROOT="$HOME/.dotnet"
            export PATH="$HOME/.dotnet:$PATH"
        fi
    fi

    if command -v dotnet &>/dev/null && dotnet --list-sdks 2>/dev/null | grep -q "^8\."; then
        echo "-> .NET 8 SDK successfully installed!"
    else
        echo "[WARNING] .NET 8 SDK could not be installed automatically."
        echo "Please install manually from: https://dotnet.microsoft.com/download/dotnet/8.0"
    fi
}

check_python() {
    echo -n "Checking Python 3 (or Node) for web serving... "
    if command -v python3 &>/dev/null; then
        echo "found ($(python3 --version 2>&1))"
        return 0
    elif command -v python &>/dev/null; then
        echo "found ($(python --version 2>&1))"
        return 0
    elif command -v npx &>/dev/null; then
        echo "found (npx)"
        return 0
    fi
    echo "MISSING"

    echo "Attempting automated installation of Python 3..."
    case "$PKG_MGR" in
        "brew") brew install python3 || true ;;
        "apt") [ -x "$(command -v sudo)" ] && sudo apt-get install -y -qq python3 || true ;;
        "dnf") [ -x "$(command -v sudo)" ] && sudo dnf install -y -q python3 || true ;;
        "pacman") [ -x "$(command -v sudo)" ] && sudo pacman -S --noconfirm python || true ;;
        *) ;;
    esac
}

check_database() {
    echo -n "Checking MySQL database & schema... "
    local schema_file="$SCRIPT_DIR/backend/Database/schema.sql"
    local seed_file="$SCRIPT_DIR/backend/Database/seed.sql"

    # Load credentials from .env if present
    local db_host="127.0.0.1"
    local db_port="3306"
    local db_user="root"
    local db_pass=""

    if [ -f "$SCRIPT_DIR/.env" ]; then
        db_user=$(grep -E '^DB_USER=' "$SCRIPT_DIR/.env" | cut -d= -f2- | tr -d '"\r' || echo "root")
        db_pass=$(grep -E '^DB_PASSWORD=' "$SCRIPT_DIR/.env" | cut -d= -f2- | tr -d '"\r' || echo "")
        db_host=$(grep -E '^DB_HOST=' "$SCRIPT_DIR/.env" | cut -d= -f2- | tr -d '"\r' || echo "127.0.0.1")
        db_port=$(grep -E '^DB_PORT=' "$SCRIPT_DIR/.env" | cut -d= -f2- | tr -d '"\r' || echo "3306")
    fi

    if ! command -v mysql &>/dev/null; then
        echo "mysql CLI not found (using backend auto-detection/SQLite dev fallback if unconfigured)."
        return 0
    fi

    # Try connecting with detected/default password, or empty
    local conn_ok=false
    local pass_args=()
    if [ -n "$db_pass" ]; then
        pass_args=("-p$db_pass")
    fi

    if mysql -h "$db_host" -P "$db_port" -u "$db_user" "${pass_args[@]}" -e "SELECT 1;" &>/dev/null; then
        conn_ok=true
    elif [ -z "$db_pass" ] && mysql -h "$db_host" -P "$db_port" -u "$db_user" -pyour_db_password -e "SELECT 1;" &>/dev/null; then
        conn_ok=true
        pass_args=("-pyour_db_password")
    fi

    if [ "$conn_ok" = false ]; then
        echo "not accessible with default credentials."
        echo "Notice: Could not authenticate to MySQL $db_host:$db_port automatically."
        read -r -s -p "Enter MySQL password for '$db_user' (or press Enter to skip DB setup): " input_pass
        echo ""
        if [ -n "$input_pass" ]; then
            pass_args=("-p$input_pass")
            if mysql -h "$db_host" -P "$db_port" -u "$db_user" "${pass_args[@]}" -e "SELECT 1;" &>/dev/null; then
                conn_ok=true
            fi
        fi
    fi

    if [ "$conn_ok" = true ]; then
        # Check if ayis_db exists and has tables
        local table_count
        table_count=$(mysql -h "$db_host" -P "$db_port" -u "$db_user" "${pass_args[@]}" -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ayis_db';" 2>/dev/null || echo "0")
        if [ "$table_count" -gt "0" ]; then
            echo "connected ('ayis_db' active with $table_count tables)."
        else
            echo "'ayis_db' missing or unseeded. Initializing schema and seed data now..."
            mysql -h "$db_host" -P "$db_port" -u "$db_user" "${pass_args[@]}" < "$schema_file"
            if [ -f "$seed_file" ]; then
                mysql -h "$db_host" -P "$db_port" -u "$db_user" "${pass_args[@]}" < "$seed_file" || true
            fi
            echo "-> Database schema and seed data populated successfully!"
        fi
    else
        echo "MySQL server inactive or skipped. ASP.NET will utilize configured connection string or SQLite."
    fi
}

# Run pre-flight steps
check_dotnet
check_python
check_database

# ── Port and Process Management ────────────────────────────────

free_port() {
    local port="$1"
    if command -v fuser &>/dev/null; then
        fuser -k "${port}/tcp" 2>/dev/null || true
    elif command -v lsof &>/dev/null; then
        local pids
        pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            kill -9 $pids 2>/dev/null || true
        fi
    else
        local pids
        pids=$(ss -tulpn 2>/dev/null | grep ":${port} " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)
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

# Resolve LAN IP cross-platform (Linux + macOS)
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

# 1. Start Backend in background
echo ""
echo "1. Starting C# ASP.NET Core Backend on port $BACKEND_PORT..."
"$SCRIPT_DIR/run-backend.sh" "$BACKEND_PORT" &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend API to respond..."
for i in {1..35}; do
    if curl -s "http://localhost:$BACKEND_PORT/api/v1/health" >/dev/null 2>&1; then
        echo "-> Backend is ready at http://localhost:$BACKEND_PORT (Swagger: /swagger)"
        break
    fi
    sleep 0.5
done

# 2. Start Frontend
echo ""
echo "=========================================================="
echo "    AYIS is running and ready for MULTI-PC OPERATION!     "
echo "=========================================================="
echo " Access locally on this machine:"
echo "   -> Frontend: http://localhost:$FRONTEND_PORT"
echo "   -> Backend:  http://localhost:$BACKEND_PORT"
if [ "$LAN_IP" != "127.0.0.1" ]; then
echo ""
echo " Access from any other PC / laptop / tablet on the same LAN:"
echo "   -> Frontend: http://$LAN_IP:$FRONTEND_PORT"
echo "   -> Backend:  http://$LAN_IP:$BACKEND_PORT/api/v1"
echo "   -> Swagger:  http://$LAN_IP:$BACKEND_PORT/swagger"
fi
echo "=========================================================="
echo "Press Ctrl+C to stop both backend and frontend."
echo ""

"$SCRIPT_DIR/run-frontend.sh" "$FRONTEND_PORT"
