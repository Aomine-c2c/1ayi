#!/usr/bin/env bash
# ==============================================================================
# AYIS Offline Presentation Package Builder (Cross-Platform)
# Produces self-contained Windows (win-x64) standalone binary + frontend + 1-click .bat
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${1:-$SCRIPT_DIR/dist/AYIS-Offline-Package}"
ZIP_OUTPUT="$SCRIPT_DIR/dist/AYIS-Offline-Package-Windows.zip"

echo "=========================================================="
echo "       AYIS Offline Presentation Package Builder          "
echo "=========================================================="

# Locate dotnet CLI
DOTNET_CMD="dotnet"
if [ -d "$HOME/.dotnet" ]; then
    export DOTNET_ROOT="$HOME/.dotnet"
    export PATH="$HOME/.dotnet:$PATH"
fi
if ! command -v dotnet &>/dev/null; then
    if [ -x "/home/sila/.dotnet/dotnet" ]; then
        DOTNET_CMD="/home/sila/.dotnet/dotnet"
    else
        echo "Error: .NET 8 SDK not found."
        exit 1
    fi
fi

API_PROJ="$SCRIPT_DIR/backend/Ayis.Api/Ayis.Api.csproj"

echo ""
echo "[1/4] Publishing self-contained .NET 8 executable for Windows (win-x64)..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

"$DOTNET_CMD" publish "$API_PROJ" \
    -c Release \
    -r win-x64 \
    --self-contained true \
    -p:PublishSingleFile=true \
    -p:IncludeNativeLibrariesForSelfExtract=true \
    -p:EnableCompressionInSingleFile=true \
    -o "$OUTPUT_DIR"

echo ""
echo "[2/4] Copying frontend & vendor assets..."
cp -r "$SCRIPT_DIR/frontend" "$OUTPUT_DIR/frontend"

echo ""
echo "[3/4] Creating offline standalone appsettings.json..."
cat << 'EOF' > "$OUTPUT_DIR/appsettings.json"
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=ayis.db"
  },
  "Jwt": {
    "Key": "AYIS_OFFLINE_SECRET_KEY_STANDALONE_DEMO_MIN_32_CHARS!",
    "Issuer": "Ayis.Api",
    "Audience": "Ayis.Frontend",
    "ExpiryMinutes": 1440
  },
  "Cors": {
    "AllowedOrigins": [
      "*"
    ]
  },
  "AccuWeather": {
    "ApiKey": "",
    "BaseUrl": "https://dataservice.accuweather.com"
  }
}
EOF

echo ""
echo "[4/4] Generating 1-click START_PRESENTATION.bat..."
cat << 'EOF' > "$OUTPUT_DIR/START_PRESENTATION.bat"
@echo off
title AYIS - Agricultural Yield Production Monitoring System
color 0A
cd /d "%~dp0"

echo ==========================================================
echo    AYIS - Agricultural Yield Production Monitoring System
echo              (Offline Presentation Mode)
echo ==========================================================
echo.
echo 1. Starting C# Backend Engine (Port 5050)...
start "AYIS Backend Service" "%~dp0Ayis.Api.exe" --urls "http://0.0.0.0:5050"

echo.
echo 2. Waiting for system initialization...
timeout /t 3 >nul

echo.
echo 3. Serving Frontend & Opening Dashboard...
start "" "http://localhost:8080"
powershell -ExecutionPolicy Bypass -File "%~dp0run-offline-frontend.ps1" -Port 8080

pause
EOF

cat << 'EOF' > "$OUTPUT_DIR/run-offline-frontend.ps1"
param ([int]$Port = 8080)
$frontendDir = Join-Path $PSScriptRoot "frontend"
Write-Host "AYIS Frontend is serving at http://localhost:$Port/ (Press Ctrl+C to close)..." -ForegroundColor Cyan

$hasPython = $false
foreach ($c in @("python", "python3", "py")) {
    $f = Get-Command $c -ErrorAction SilentlyContinue
    if ($f) {
        $ver = & $c --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $ver -match "Python\s+\d+") {
            $hasPython = $true
            & $c -m http.server $Port --directory "$frontendDir"
            break
        }
    }
}

if (-not $hasPython) {
    $httpListener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$Port/"
    $httpListener.Prefixes.Add($prefix)
    try {
        $httpListener.Start()
        $mimeTypes = @{
            ".html" = "text/html; charset=utf-8";
            ".css"  = "text/css; charset=utf-8";
            ".js"   = "application/javascript; charset=utf-8";
            ".json" = "application/json; charset=utf-8";
            ".png"  = "image/png";
            ".jpg"  = "image/jpeg";
            ".jpeg" = "image/jpeg";
            ".svg"  = "image/svg+xml";
            ".ico"  = "image/x-icon"
        }
        while ($httpListener.IsListening) {
            $context = $httpListener.GetContext()
            $rel = $context.Request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
            $target = Join-Path $frontendDir $rel
            if (Test-Path $target -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($target).ToLower()
                $context.Response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $b = [System.IO.File]::ReadAllBytes($target)
                $context.Response.ContentLength64 = $b.Length
                $context.Response.OutputStream.Write($b, 0, $b.Length)
            } else {
                $context.Response.StatusCode = 404
            }
            $context.Response.OutputStream.Close()
        }
    } finally {
        if ($httpListener) { $httpListener.Stop(); $httpListener.Close() }
    }
}
EOF

cat << 'EOF' > "$OUTPUT_DIR/README_PRESENTATION.txt"
================================================================================
 AYIS — Agricultural Yield Production Monitoring System (Offline Presentation)
================================================================================

HOW TO PRESENT TO LECTURERS:
1. Double-click "START_PRESENTATION.bat".
2. Your default web browser will automatically open to:
   http://localhost:8080

DEFAULT LOGIN CREDENTIALS:
- Farm Manager / Admin:
  Username: admin
  Password: Admin@123!

- Farmer:
  Username: farmer1
  Password: Farmer@123!
  (or tendai / password123)

SYSTEM HIGHLIGHTS:
- 100% Offline: Operates seamlessly in airplane mode or disconnected lecture halls.
- Self-Contained: No .NET SDK, Python, or MySQL installation required on this PC.
- Embedded SQLite: Pre-populated with farm parcels, crop varieties, and weather telemetry.
================================================================================
EOF

mkdir -p "$SCRIPT_DIR/dist"
echo ""
echo "Creating compressed ZIP archive ($ZIP_OUTPUT)..."
rm -f "$ZIP_OUTPUT"
(cd "$SCRIPT_DIR/dist" && zip -r "AYIS-Offline-Package-Windows.zip" "AYIS-Offline-Package")

echo ""
echo "=========================================================="
echo "  Offline Package Built Successfully!                     "
echo "  Folder: $OUTPUT_DIR"
echo "  ZIP:    $ZIP_OUTPUT"
echo "=========================================================="
