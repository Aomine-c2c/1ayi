<#
.SYNOPSIS
    Builds a 100% Self-Contained Offline Distribution Package for Windows
.DESCRIPTION
    Compiles the C# ASP.NET Core backend into a self-contained single-file executable
    (bundled with the .NET 8 runtime) and packages it with the local frontend, 
    pre-configured SQLite database, and 1-click presentation launcher.
    
    The resulting folder or ZIP can be copied to any Windows PC (via flash drive, 
    Google Drive, or WhatsApp) and runs 100% offline with zero prerequisites.
#>

param (
    [string]$OutputDir = "dist\AYIS-Offline-Package",
    [switch]$CreateZip
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AYIS Offline Presentation Package Builder          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) { $scriptRoot = Get-Location }

# 1. Resolve .NET SDK CLI
$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd -and (Test-Path "C:\Program Files\dotnet\dotnet.exe")) {
    $dotnetCmd = "C:\Program Files\dotnet\dotnet.exe"
}
if (-not $dotnetCmd) {
    Write-Error "The .NET SDK ('dotnet') is required on this build PC to generate the offline package."
    exit 1
}

$apiProj = Join-Path $scriptRoot "backend\Ayis.Api\Ayis.Api.csproj"
if (-not (Test-Path $apiProj)) {
    Write-Error "Cannot find backend project at: $apiProj"
    exit 1
}

$targetDist = Join-Path $scriptRoot $OutputDir
if (Test-Path $targetDist) {
    Write-Host "Cleaning previous output directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $targetDist -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $targetDist -Force | Out-Null

# 2. Publish Self-Contained Windows Executable
Write-Host "`n[1/4] Publishing self-contained .NET 8 executable (win-x64)..." -ForegroundColor Green
Write-Host "This bundles the .NET runtime directly inside the executable so the destination PC does not need .NET installed." -ForegroundColor Gray

& $dotnetCmd publish "$apiProj" `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o "$targetDist"

if ($LASTEXITCODE -ne 0) {
    Write-Error "dotnet publish failed with exit code $LASTEXITCODE."
    exit 1
}

# 3. Copy Frontend & Static Assets
Write-Host "`n[2/4] Packaging Vanilla web frontend and local assets..." -ForegroundColor Green
$frontendSource = Join-Path $scriptRoot "frontend"
$frontendDest = Join-Path $targetDist "frontend"
Copy-Item -Recurse -Force $frontendSource $frontendDest

# 4. Generate Pre-configured Offline appsettings.json
Write-Host "`n[3/4] Creating offline production configuration..." -ForegroundColor Green
$offlineAppSettings = @'
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
'@
$offlineAppSettings | Out-File -FilePath (Join-Path $targetDist "appsettings.json") -Encoding utf8

# 5. Generate 1-Click Offline Presentation Launchers
Write-Host "`n[4/4] Generating 1-click double-click presentation launchers..." -ForegroundColor Green

# A. Windows .bat launcher (works on every Windows version with double-click)
$batContent = @'
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
powershell -ExecutionPolicy Bypass -File "%~dp0frontend\..\run-offline-frontend.ps1" -Port 8080

pause
'@
$batContent | Out-File -FilePath (Join-Path $targetDist "START_PRESENTATION.bat") -Encoding ascii

# B. Helper frontend runner inside the package
$offlineFrontendRunner = @'
param ([int]$Port = 8080)
$frontendDir = Join-Path $PSScriptRoot "frontend"
Write-Host "AYIS Frontend is serving at http://localhost:$Port/ (Press Ctrl+C to close)..." -ForegroundColor Cyan

# Check Python first, otherwise use native PowerShell HTTP listener
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
'@
$offlineFrontendRunner | Out-File -FilePath (Join-Path $targetDist "run-offline-frontend.ps1") -Encoding utf8

# C. Add Quick Instructions Readme
$readmeContent = @'
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

SYSTEM NOTES:
- 100% Offline: No internet, no Wi-Fi, and no data connection required.
- Self-Contained: No .NET SDK, Python, or MySQL installation required.
- SQLite Database: Embedded and pre-populated with farm parcels, crops, and telemetry.
================================================================================
'@
$readmeContent | Out-File -FilePath (Join-Path $targetDist "README_PRESENTATION.txt") -Encoding utf8

# Optional ZIP creation
if ($CreateZip) {
    $zipPath = Join-Path $scriptRoot "dist\AYIS-Offline-Package-Windows.zip"
    Write-Host "`nCreating compressed ZIP archive ($zipPath)..." -ForegroundColor Green
    if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
    Compress-Archive -Path "$targetDist\*" -DestinationPath $zipPath
    Write-Host "-> Created: $zipPath" -ForegroundColor Cyan
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Offline Presentation Package Built Successfully!       " -ForegroundColor Green
Write-Host "  Location: $targetDist" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Simply copy this folder (or zip) to any Windows PC and double-click 'START_PRESENTATION.bat'." -ForegroundColor Yellow
