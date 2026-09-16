<#
.SYNOPSIS
    Automated MySQL 8 Database Initialization for AYIS
.DESCRIPTION
    Creates the 'ayis_db' database and applies schema.sql and seed.sql using the local MySQL CLI.
#>

param (
    [string]$MySqlUser = "root",
    [string]$MySqlPassword = "root_password",
    [string]$MySqlHost = "localhost",
    [int]$MySqlPort = 3306
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AYIS MySQL 8 Database Initializer     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if mysql CLI is available
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Warning "The 'mysql' command was not found in your system PATH."
    Write-Host "Please ensure MySQL 8 is installed and added to PATH, or provide the full path to mysql.exe." -ForegroundColor Yellow
    Write-Host "Expected default path: 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'" -ForegroundColor Gray
    
    $commonPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    $commonPath84 = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    
    if (Test-Path $commonPath) {
        $mysqlCmd = $commonPath
        Write-Host "Found MySQL at: $commonPath" -ForegroundColor Green
    } elseif (Test-Path $commonPath84) {
        $mysqlCmd = $commonPath84
        Write-Host "Found MySQL at: $commonPath84" -ForegroundColor Green
    } else {
        Write-Error "Could not locate mysql.exe. Please install MySQL 8 or run schema.sql manually in MySQL Workbench."
        exit 1
    }
} else {
    $mysqlCmd = "mysql"
}

$schemaPath = Join-Path $PSScriptRoot "backend\Database\schema.sql"
$seedPath = Join-Path $PSScriptRoot "backend\Database\seed.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Error "Schema file not found at: $schemaPath"
    exit 1
}

Write-Host "`n1. Applying schema.sql to $MySqlHost:$MySqlPort..." -ForegroundColor Green
$cmdArgs = @(
    "-h", $MySqlHost,
    "-P", $MySqlPort,
    "-u", $MySqlUser
)

if ($MySqlPassword) {
    $cmdArgs += "-p$MySqlPassword"
}

# Run Schema
& $mysqlCmd @cmdArgs -e "source $schemaPath"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to apply schema.sql"
    exit 1
}
Write-Host "-> Schema applied successfully." -ForegroundColor Green

# Run Seed
if (Test-Path $seedPath) {
    Write-Host "`n2. Applying seed.sql (reference crops, regions, and spatial demo data)..." -ForegroundColor Green
    & $mysqlCmd @cmdArgs -e "source $seedPath"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to apply seed.sql. You may apply it manually."
    } else {
        Write-Host "-> Seed data populated successfully." -ForegroundColor Green
    }
}

Write-Host "`nDatabase setup complete! 'ayis_db' is ready." -ForegroundColor Cyan
