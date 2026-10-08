<#
.SYNOPSIS
    Runs the C# ASP.NET Core Minimal API Backend Locally
.DESCRIPTION
    Launches Ayis.Api on http://localhost:5050 (or requested port) using native dotnet CLI.
#>

param (
    [int]$Port = 5050
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting AYIS C# Backend (.NET 8)      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Ensure dotnet in PATH if default install location exists
if (Test-Path "C:\Program Files\dotnet") {
    if ($env:Path -notlike "*C:\Program Files\dotnet*") {
        $env:Path = "C:\Program Files\dotnet;" + $env:Path
    }
}

$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd) {
    if (Test-Path "C:\Program Files\dotnet\dotnet.exe") {
        $dotnetCmd = "C:\Program Files\dotnet\dotnet.exe"
    } else {
        Write-Warning "The 'dotnet' command was not found in your system PATH."
        Write-Host "Please install the .NET 8 SDK from https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Red
        Write-Host "`nPress any key to close this window..." -ForegroundColor Gray
        $null = [Console]::ReadKey()
        exit 1
    }
} else {
    $dotnetCmd = "dotnet"
}

$apiDir = Join-Path $PSScriptRoot "backend\Ayis.Api"
Set-Location $apiDir

# Verify .NET SDK is actually present (not just runtime)
$sdks = & $dotnetCmd --list-sdks 2>$null
if (-not $sdks) {
    Write-Warning "No .NET SDK was found by dotnet CLI (only runtime or empty installation)."
    Write-Host "Please install the .NET 8 SDK (x64) from:" -ForegroundColor Yellow
    Write-Host "https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Cyan
    Write-Host "`nPress any key to close this window..." -ForegroundColor Gray
    $null = [Console]::ReadKey()
    exit 1
}

Write-Host "Detected .NET SDKs:" -ForegroundColor Gray
$sdks | ForEach-Object { Write-Host " - $_" -ForegroundColor Gray }

# Terminate any dangling/orphaned Ayis.Api processes to release locks on Ayis.Api.exe
$lockedProcs = Get-Process -Name "Ayis.Api" -ErrorAction SilentlyContinue
if ($lockedProcs) {
    Write-Host "Notice: Found running instance(s) of Ayis.Api. Terminating to release file locks..." -ForegroundColor Yellow
    foreach ($p in $lockedProcs) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        } catch { }
    }
    Start-Sleep -Milliseconds 800
}

Write-Host "`nRestoring NuGet packages..." -ForegroundColor Green
& $dotnetCmd restore
if ($LASTEXITCODE -ne 0) {
    Write-Warning "NuGet restore encountered issues. Attempting to proceed with build..."
}

Write-Host "Launching AYIS Minimal API on http://localhost:$Port..." -ForegroundColor Green
Write-Host "Swagger UI will be available at: http://localhost:$Port/swagger" -ForegroundColor Cyan

$env:ASPNETCORE_URLS = "http://0.0.0.0:$Port"
$env:ASPNETCORE_ENVIRONMENT = "Development"

& $dotnetCmd run --urls "http://0.0.0.0:$Port"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBackend process exited with error code $LASTEXITCODE." -ForegroundColor Red
    Write-Host "Press any key to close this window..." -ForegroundColor Gray
    $null = [Console]::ReadKey()
}
