<#
.SYNOPSIS
    Runs the C# ASP.NET Core Minimal API Backend Locally
.DESCRIPTION
    Launches Ayis.Api on http://localhost:8000 using native dotnet CLI.
#>

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting AYIS C# Backend (.NET 8)      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$dotnetCmd = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnetCmd) {
    if (Test-Path "C:\Program Files\dotnet\dotnet.exe") {
        $dotnetCmd = "C:\Program Files\dotnet\dotnet.exe"
    } else {
        Write-Warning "The 'dotnet' command was not found in your system PATH."
        Write-Host "Please install the .NET 8 SDK from https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
        exit 1
    }
} else {
    $dotnetCmd = "dotnet"
}

$apiDir = Join-Path $PSScriptRoot "backend\Ayis.Api"
Set-Location $apiDir

Write-Host "Restoring NuGet packages..." -ForegroundColor Green
dotnet restore

Write-Host "Launching AYIS Minimal API on http://localhost:8000..." -ForegroundColor Green
Write-Host "Swagger UI will be available at: http://localhost:8000/swagger" -ForegroundColor Cyan

$env:ASPNETCORE_URLS = "http://localhost:8000"
$env:ASPNETCORE_ENVIRONMENT = "Development"

dotnet run
