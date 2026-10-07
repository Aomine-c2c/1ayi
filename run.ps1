<#
.SYNOPSIS
    Unified Cross-Platform Runner for AYIS (Backend & Frontend)
.DESCRIPTION
    Agricultural Yield Production Monitoring System (AYIS)
    Performs pre-flight checks and automated silent installation of missing
    prerequisites (.NET 8 SDK, MySQL, Python). Automatically checks and initializes
    the MySQL schema and seed data. Launches the C# ASP.NET Core Minimal API
    (standard port 5050) in a dedicated terminal window and serves the Vanilla
    frontend on http://localhost:8080.
#>

param (
    [int]$FrontendPort = 8080,
    [int]$BackendPort = 5050,
    [string]$MySqlPassword = "",
    [switch]$NoBrowser
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AYIS Universal Cross-Platform Runner (Windows)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ── 1. Pre-flight Checks & Silent Auto-Installation ─────────────

# A. .NET 8 SDK Check
Write-Host "`n[1/3] Checking .NET 8 SDK..." -ForegroundColor Cyan
$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
$hasDotNet8 = $false

if ($dotnetCmd) {
    $sdks = dotnet --list-sdks 2>$null
    if ($sdks -match "^8\.") {
        $hasDotNet8 = $true
        Write-Host "-> Found .NET 8 SDK: $(dotnet --version)" -ForegroundColor Green
    }
}

if (-not $hasDotNet8) {
    Write-Warning ".NET 8 SDK not found."
    Write-Host "Attempting automated installation via winget/choco..." -ForegroundColor Yellow
    
    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
    $chocoCmd = Get-Command choco -ErrorAction SilentlyContinue

    if ($wingetCmd) {
        Write-Host "Running: winget install --id Microsoft.DotNet.SDK.8 -e --silent --accept-package-agreements --accept-source-agreements" -ForegroundColor Gray
        winget install --id Microsoft.DotNet.SDK.8 -e --silent --accept-package-agreements --accept-source-agreements
    } elseif ($chocoCmd) {
        Write-Host "Running: choco install dotnet-8.0-sdk -y" -ForegroundColor Gray
        choco install dotnet-8.0-sdk -y
    } else {
        Write-Warning "Neither winget nor choco is available."
        Write-Host "Please download and install .NET 8 SDK manually from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Red
    }
    
    # Refresh PATH environment variable
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# B. Python 3 (or Node) Check for Web Server
Write-Host "`n[2/3] Checking Python 3 / Web Server..." -ForegroundColor Cyan
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
$python3Cmd = Get-Command python3 -ErrorAction SilentlyContinue
$npxCmd = Get-Command npx -ErrorAction SilentlyContinue

if (-not ($pythonCmd -or $python3Cmd -or $npxCmd)) {
    Write-Warning "Neither Python nor Node/npx is installed."
    Write-Host "Attempting automated installation of Python via winget..." -ForegroundColor Yellow
    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        winget install --id Python.Python.3.11 -e --silent --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
} else {
    Write-Host "-> Web server runtime found." -ForegroundColor Green
}

# C. Database Verification & Initialization
Write-Host "`n[3/3] Checking MySQL Database..." -ForegroundColor Cyan
$mysqlService = Get-Service -Name "MySQL*", "mariadb" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($mysqlService -and $mysqlService.Status -ne "Running") {
    Write-Host "MySQL service is stopped. Attempting to start..." -ForegroundColor Yellow
    try {
        Start-Service $mysqlService.Name -ErrorAction Stop
        Write-Host "-> Started MySQL service ($($mysqlService.Name))." -ForegroundColor Green
    } catch {
        Write-Warning "Could not start MySQL service automatically. Please start it from Services.msc."
    }
}

$setupDbScript = Join-Path $PSScriptRoot "setup-database.ps1"
if (Test-Path $setupDbScript) {
    Write-Host "Verifying 'ayis_db' schema and seed status..." -ForegroundColor Gray
    if ($MySqlPassword) {
        & powershell -ExecutionPolicy Bypass -File "$setupDbScript" -MySqlPassword "$MySqlPassword"
    } else {
        & powershell -ExecutionPolicy Bypass -File "$setupDbScript"
    }
}

# ── 2. Launch Backend in Dedicated Terminal ──────────────────────
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "Launching Services (Backend: $BackendPort, Frontend: $FrontendPort)..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
if (Test-Path $backendScript) {
    Write-Host "-> Starting C# Minimal API in a new terminal window..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File `"$backendScript`" -Port $BackendPort"
    Write-Host "   Local API: http://localhost:$BackendPort" -ForegroundColor Green
    Write-Host "   Swagger:   http://localhost:$BackendPort/swagger" -ForegroundColor Cyan
}

# ── 3. Open Browser ──────────────────────────────────────────────
$frontendUrl = "http://localhost:$FrontendPort"
if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Write-Host "`nOpening $frontendUrl in default browser..." -ForegroundColor Green
    Start-Process $frontendUrl
}

# ── 4. Serve Frontend in Current Window ─────────────────────────
$frontendScript = Join-Path $PSScriptRoot "run-frontend.ps1"
if (Test-Path $frontendScript) {
    & powershell -ExecutionPolicy Bypass -File "$frontendScript" -Port $FrontendPort
}
