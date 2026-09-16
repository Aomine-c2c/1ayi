<#
.SYNOPSIS
    Runs the Vanilla HTML/CSS/JS Frontend Locally
.DESCRIPTION
    Serves the 'frontend' folder on http://localhost:8080 using Python or Node.
#>

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting AYIS Frontend (Vanilla Web)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
$npxCmd = Get-Command npx -ErrorAction SilentlyContinue

if ($pythonCmd) {
    Write-Host "Serving frontend via Python on http://localhost:8080..." -ForegroundColor Green
    python -m http.server 8080 --directory "$frontendDir"
} elseif ($npxCmd) {
    Write-Host "Serving frontend via npx serve on http://localhost:8080..." -ForegroundColor Green
    npx serve "$frontendDir" -l 8080
} else {
    Write-Warning "Neither Python nor Node/npx was found in PATH."
    Write-Host "Opening index.html directly in your default browser..." -ForegroundColor Yellow
    Start-Process (Join-Path $frontendDir "index.html")
}
