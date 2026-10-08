<#
.SYNOPSIS
    Automated MySQL 8 Database Initialization for AYIS
.DESCRIPTION
    Checks whether 'ayis_db' exists. If missing or unseeded, creates 'ayis_db'
    and applies schema.sql and seed.sql using local MySQL CLI.
#>

param (
    [string]$MySqlUser = "root",
    [string]$MySqlPassword = "",
    [string]$MySqlHost = "localhost",
    [int]$MySqlPort = 3306
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AYIS MySQL 8 Database Initializer      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Locate mysql CLI
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    $searchPaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe",
        "C:\Program Files\MariaDB*\bin\mysql.exe",
        "C:\tools\mysql\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe"
    )
    foreach ($path in $searchPaths) {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $mysqlCmd = $found.FullName
            Write-Host "Found MySQL at: $mysqlCmd" -ForegroundColor Green
            break
        }
    }
} else {
    $mysqlCmd = "mysql"
}

if (-not $mysqlCmd) {
    Write-Warning "Could not locate mysql.exe. Ensure MySQL is running or run schema.sql manually."
    return
}

$schemaPath = Join-Path $PSScriptRoot "backend\Database\schema.sql"
$seedPath = Join-Path $PSScriptRoot "backend\Database\seed.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Error "Schema file not found at: $schemaPath"
    return
}

# Resolve credentials: test empty, test default 'your_db_password', test passed param, prompt if failed
$passwordsToTry = @()
if ($MySqlPassword) { $passwordsToTry += $MySqlPassword }
$passwordsToTry += @("your_db_password", "root", "")

$workingPassword = $null
$authenticated = $false

foreach ($pwd in $passwordsToTry) {
    $testArgs = @("-h", $MySqlHost, "-P", $MySqlPort, "-u", $MySqlUser)
    if ($pwd) { $testArgs += "-p$pwd" }
    $testArgs += @("-e", "SELECT 1;")
    
    $out = & $mysqlCmd @testArgs 2>&1
    if ($LASTEXITCODE -eq 0) {
        $workingPassword = $pwd
        $authenticated = $true
        break
    }
}

if (-not $authenticated) {
    Write-Host "MySQL authentication required for user '$MySqlUser'." -ForegroundColor Yellow
    $promptedPwd = Read-Host "Enter MySQL root password (or press Enter to skip)" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($promptedPwd)
    $plainPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    
    if ($plainPwd) {
        $testArgs = @("-h", $MySqlHost, "-P", $MySqlPort, "-u", $MySqlUser, "-p$plainPwd", "-e", "SELECT 1;")
        & $mysqlCmd @testArgs 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $workingPassword = $plainPwd
            $authenticated = $true
        }
    }
}

if (-not $authenticated) {
    Write-Warning "Could not connect to MySQL server. Skipping database initialization."
    return
}

# Check if tables exist in ayis_db
$checkArgs = @("-h", $MySqlHost, "-P", $MySqlPort, "-u", $MySqlUser)
if ($workingPassword) { $checkArgs += "-p$workingPassword" }
$checkArgs += @("-N", "-s", "-e", "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ayis_db';")

$tableCount = & $mysqlCmd @checkArgs 2>$null
if ($tableCount -and [int]$tableCount -gt 0) {
    Write-Host "-> 'ayis_db' is already initialized ($tableCount tables found). Skipping setup." -ForegroundColor Green
    return
}

Write-Host "`n1. Applying schema.sql to ${MySqlHost}:${MySqlPort}..." -ForegroundColor Green
$schemaArgs = @("-h", $MySqlHost, "-P", $MySqlPort, "-u", $MySqlUser)
if ($workingPassword) { $schemaArgs += "-p$workingPassword" }

& $mysqlCmd @schemaArgs -e "source $schemaPath"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply schema.sql"
    return
}
Write-Host "-> Schema applied successfully." -ForegroundColor Green

if (Test-Path $seedPath) {
    Write-Host "`n2. Applying seed.sql (reference crops, regions, and spatial demo data)..." -ForegroundColor Green
    & $mysqlCmd @schemaArgs -e "source $seedPath"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "-> Seed data populated successfully." -ForegroundColor Green
    }
}

Write-Host "`nDatabase setup complete! 'ayis_db' is ready." -ForegroundColor Cyan
