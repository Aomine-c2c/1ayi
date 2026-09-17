<#
.SYNOPSIS
    Runs the Vanilla HTML/CSS/JS Frontend Locally
.DESCRIPTION
    Serves the 'frontend' folder on http://localhost:8080 using Python or Node.
#>

param (
    [int]$Port = 8080
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting AYIS Frontend (Vanilla Web)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"

# Find first available port starting from requested port
function Get-AvailablePort([int]$startPort) {
    $portToCheck = $startPort
    while ($portToCheck -lt ($startPort + 100)) {
        $tcpListener = $null
        try {
            $tcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $portToCheck)
            $tcpListener.Start()
            $tcpListener.Stop()
            return $portToCheck
        } catch {
            $portToCheck++
        } finally {
            if ($tcpListener -ne $null) { $tcpListener.Dispose() }
        }
    }
    return $startPort
}

$effectivePort = Get-AvailablePort $Port
if ($effectivePort -ne $Port) {
    Write-Host "Notice: Port $Port is in use. Automatically switched to port $effectivePort." -ForegroundColor Yellow
}

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
$npxCmd = Get-Command npx -ErrorAction SilentlyContinue

if ($pythonCmd) {
    Write-Host "Serving frontend via Python on http://localhost:$effectivePort..." -ForegroundColor Green
    python -m http.server $effectivePort --directory "$frontendDir"
} elseif ($npxCmd) {
    Write-Host "Serving frontend via npx serve on http://localhost:$effectivePort..." -ForegroundColor Green
    npx serve "$frontendDir" -l $effectivePort
} else {
    Write-Warning "Neither Python nor Node/npx was found in PATH."
    Write-Host "Opening index.html directly in your default browser..." -ForegroundColor Yellow
    Start-Process (Join-Path $frontendDir "index.html")
}
