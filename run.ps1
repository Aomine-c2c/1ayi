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

# Ensure dotnet in PATH if standard Windows install exists
if (Test-Path "C:\Program Files\dotnet") {
    if ($env:Path -notlike "*C:\Program Files\dotnet*") {
        $env:Path = "C:\Program Files\dotnet;" + $env:Path
    }
}

# A. .NET 8 SDK Check
Write-Host "`n[1/3] Checking .NET 8 SDK..." -ForegroundColor Cyan
$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd -and (Test-Path "C:\Program Files\dotnet\dotnet.exe")) {
    $dotnetCmd = "C:\Program Files\dotnet\dotnet.exe"
}

$hasDotNetSdk = $false
$installedSdks = @()

if ($dotnetCmd) {
    try {
        $rawSdks = & $dotnetCmd --list-sdks 2>$null
        if ($rawSdks) {
            $installedSdks = $rawSdks
            $hasDotNetSdk = $true
            Write-Host "-> Found installed .NET SDK(s):" -ForegroundColor Green
            $installedSdks | ForEach-Object { Write-Host "   - $_" -ForegroundColor Green }
        }
    } catch { }
}

if (-not $hasDotNetSdk) {
    Write-Warning ".NET SDK was not detected (required to build and run C# backend)."
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
    $env:Path = "C:\Program Files\dotnet;" + [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# B. Python 3 (or Node) Check for Web Server
Write-Host "`n[2/3] Checking Python 3 / Web Server..." -ForegroundColor Cyan
$hasPythonOrNode = $false
foreach ($cmd in @("python", "python3", "py")) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) {
        $ver = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $ver -match "Python\s+\d+") {
            $hasPythonOrNode = $true
            Write-Host "-> Found Python: $ver" -ForegroundColor Green
            break
        }
    }
}

if (-not $hasPythonOrNode) {
    $npxCmd = Get-Command npx -ErrorAction SilentlyContinue
    if ($npxCmd) {
        $hasPythonOrNode = $true
        Write-Host "-> Found Node / npx web runtime." -ForegroundColor Green
    }
}

if (-not $hasPythonOrNode) {
    Write-Warning "Neither functional Python nor Node was found in PATH."
    Write-Host "Notice: The runner includes a built-in PowerShell web server fallback, so the frontend will still serve cleanly." -ForegroundColor Yellow
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

# Proactively terminate any dangling Ayis.Api background processes to release binary locks
Get-Process -Name "Ayis.Api" -ErrorAction SilentlyContinue | ForEach-Object {
    try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch { }
}

# ── Function to check and free port or find next available port ──
function Resolve-SafePort([int]$desiredPort, [string]$serviceName) {
    # Check if port is in use
    $inUse = $false
    try {
        $testListener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback), $desiredPort
        $testListener.Start()
        $testListener.Stop()
    } catch {
        $inUse = $true
    }

    if ($inUse) {
        Write-Host "Notice: Port $desiredPort is currently occupied for $serviceName." -ForegroundColor Yellow
        Write-Host "Attempting to auto-terminate orphaned process on port $desiredPort..." -ForegroundColor Yellow
        try {
            $connections = Get-NetTCPConnection -LocalPort $desiredPort -ErrorAction SilentlyContinue
            if ($connections) {
                foreach ($conn in $connections) {
                    if ($conn.OwningProcess -and $conn.OwningProcess -gt 4) {
                        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                    }
                }
                Start-Sleep -Milliseconds 800
            }
        } catch { }

        # Verify if freed
        try {
            $testListener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback), $desiredPort
            $testListener.Start()
            $testListener.Stop()
            Write-Host "-> Successfully freed port $desiredPort." -ForegroundColor Green
            return $desiredPort
        } catch {
            # Find next free port
            $nextPort = $desiredPort + 1
            while ($nextPort -lt ($desiredPort + 100)) {
                try {
                    $testListener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback), $nextPort
                    $testListener.Start()
                    $testListener.Stop()
                    Write-Host "-> Switched $serviceName to safe port: $nextPort" -ForegroundColor Cyan
                    return $nextPort
                } catch {
                    $nextPort++
                }
            }
        }
    }
    return $desiredPort
}

$EffectiveBackendPort = Resolve-SafePort $BackendPort "Backend API"
$EffectiveFrontendPort = Resolve-SafePort $FrontendPort "Frontend"

# ── 2. Launch Backend in Dedicated Terminal ──────────────────────
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "Launching Services (Backend: $EffectiveBackendPort, Frontend: $EffectiveFrontendPort)..." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
if (Test-Path $backendScript) {
    Write-Host "-> Starting C# Minimal API in a new terminal window..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$backendScript`" -Port $EffectiveBackendPort"
    Write-Host "   Local API: http://localhost:$EffectiveBackendPort" -ForegroundColor Green
    Write-Host "   Swagger:   http://localhost:$EffectiveBackendPort/swagger" -ForegroundColor Cyan
}

# ── 3. Open Browser ──────────────────────────────────────────────
$frontendUrl = "http://localhost:$EffectiveFrontendPort"
if ($EffectiveBackendPort -ne 5050) {
    # If backend was shifted, pass the URL param so frontend auto-connects
    $frontendUrl = "$frontendUrl/?api=http://localhost:$EffectiveBackendPort/api/v1"
}

if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Write-Host "`nOpening $frontendUrl in default browser..." -ForegroundColor Green
    Start-Process $frontendUrl
}

# ── 4. Serve Frontend in Current Window ─────────────────────────
$frontendScript = Join-Path $PSScriptRoot "run-frontend.ps1"
if (Test-Path $frontendScript) {
    & powershell -ExecutionPolicy Bypass -File "$frontendScript" -Port $EffectiveFrontendPort
}
