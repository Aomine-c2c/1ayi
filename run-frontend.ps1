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
            $tcpListener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback), $portToCheck
            $tcpListener.Start()
            $tcpListener.Stop()
            return $portToCheck
        } catch {
            $portToCheck++
        } finally {
            if ($tcpListener -ne $null) {
                try { $tcpListener.Stop() } catch { }
            }
        }
    }
    return $startPort
}

$effectivePort = Get-AvailablePort $Port
if ($effectivePort -ne $Port) {
    Write-Host "Notice: Port $Port is in use. Automatically switched to port $effectivePort." -ForegroundColor Yellow
}

# Check for real working Python (skip Microsoft Store stub)
$hasPython = $false
$realPythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) {
        $ver = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $ver -match "Python\s+\d+") {
            $hasPython = $true
            $realPythonCmd = $cmd
            break
        }
    }
}

$npxCmd = Get-Command npx -ErrorAction SilentlyContinue

if ($hasPython) {
    Write-Host "Serving frontend via Python on http://localhost:$effectivePort..." -ForegroundColor Green
    & $realPythonCmd -m http.server $effectivePort --directory "$frontendDir"
} elseif ($npxCmd) {
    Write-Host "Serving frontend via npx serve on http://localhost:$effectivePort..." -ForegroundColor Green
    npx serve "$frontendDir" -l $effectivePort
} else {
    Write-Host "No Python or Node web server detected. Starting built-in lightweight PowerShell web server on http://localhost:$effectivePort..." -ForegroundColor Green
    
    $httpListener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$effectivePort/"
    $httpListener.Prefixes.Add($prefix)
    try {
        $httpListener.Start()
        Write-Host "AYIS Frontend is serving at $prefix (Press Ctrl+C to stop)..." -ForegroundColor Cyan
        
        $mimeTypes = @{
            ".html" = "text/html; charset=utf-8";
            ".css"  = "text/css; charset=utf-8";
            ".js"   = "application/javascript; charset=utf-8";
            ".json" = "application/json; charset=utf-8";
            ".png"  = "image/png";
            ".jpg"  = "image/jpeg";
            ".jpeg" = "image/jpeg";
            ".svg"  = "image/svg+xml";
            ".ico"  = "image/x-icon";
            ".woff" = "font/woff";
            ".woff2"= "font/woff2"
        }

        while ($httpListener.IsListening) {
            $context = $httpListener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $relPath = $request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "index.html" }
            $filePath = Join-Path $frontendDir $relPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
            $response.OutputStream.Close()
        }
    } catch {
        Write-Warning "PowerShell HTTP listener encountered an issue: $_"
        Write-Host "Opening index.html directly in browser..." -ForegroundColor Yellow
        Start-Process (Join-Path $frontendDir "index.html")
    } finally {
        if ($httpListener -ne $null) {
            try { $httpListener.Stop() } catch { }
            try { $httpListener.Close() } catch { }
        }
    }
}
