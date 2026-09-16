<#
.SYNOPSIS
    Unified Runner for AYIS (Backend & Frontend)
.DESCRIPTION
    Launches the C# ASP.NET Core Minimal API in a dedicated terminal window
    so you can monitor live logs, then starts the Vanilla frontend web server
    and automatically opens your default browser at http://localhost:8080.
#>

param (
    [int]$FrontendPort = 8080,
    [int]$BackendPort = 8000,
    [switch]$NoBrowser
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       AYIS Unified System Runner         " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check for dotnet
$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnetExe = if ($dotnetCmd) { "dotnet" } elseif (Test-Path "C:\Program Files\dotnet\dotnet.exe") { "C:\Program Files\dotnet\dotnet.exe" } else { $null }

if (-not $dotnetExe) {
    Write-Warning "The 'dotnet' command was not found in your system PATH."
    Write-Host "Please install .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    Write-Host "Proceeding with frontend only for now..." -ForegroundColor Gray
} else {
    Write-Host "`n1. Launching C# ASP.NET Core Backend in a new terminal window..." -ForegroundColor Green
    $backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
    
    # Start backend in a new PowerShell window with a clear title
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File `"$backendScript`""
    Write-Host "-> C# Backend running at http://localhost:$BackendPort (Swagger at /swagger)" -ForegroundColor Cyan
}

# 2. Wait a moment and launch browser
$frontendUrl = "http://localhost:$FrontendPort"
if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Write-Host "`n2. Opening $frontendUrl in default browser..." -ForegroundColor Green
    Start-Process $frontendUrl
}

# 3. Serve Frontend in Current Window
Write-Host "`n3. Serving Vanilla Frontend in this terminal window..." -ForegroundColor Green
Write-Host "Press CTRL+C in this window to stop the frontend." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
$npxCmd = Get-Command npx -ErrorAction SilentlyContinue

if ($pythonCmd) {
    python -m http.server $FrontendPort --directory "$frontendDir"
} elseif ($npxCmd) {
    npx serve "$frontendDir" -l $FrontendPort
} else {
    Write-Warning "Neither Python nor Node/npx is available to serve files over HTTP."
    Write-Host "Opened index.html directly via file protocol." -ForegroundColor Yellow
}
