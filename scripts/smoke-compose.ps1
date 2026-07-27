#Requires -Version 5.1
[CmdletBinding()]
param(
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
$env:FRONTEND_PORT = $FrontendPort
$frontendUrl = "http://localhost:$FrontendPort"

$requiredServices = @('db', 'backend', 'frontend')
$services = @(docker compose config --services)
if ($LASTEXITCODE -ne 0) { throw 'Unable to parse Docker Compose configuration' }

foreach ($service in $requiredServices) {
    if ($service -notin $services) { throw "Compose is missing required service: $service" }
}

Write-Host '==> 1/3 Build and start all services'
docker compose up --build -d --wait
if ($LASTEXITCODE -ne 0) { throw 'Service build, startup, or health check failed' }

Write-Host '==> 2/3 Verify all services are healthy'
foreach ($service in $requiredServices) {
    $containerId = (docker compose ps -q $service).Trim()
    if (-not $containerId) { throw "Service container not found: $service" }
    $health = (docker inspect --format '{{.State.Health.Status}}' $containerId).Trim()
    if ($health -ne 'healthy') { throw "$service is not healthy (current: $health)" }
}

Write-Host '==> 3/3 Verify Demo login and session persistence'
$loginBody = @{
    username = 'user'
    clientHash = 'e73b3e692eacfa6219213cac29e48e053064d9ee138ee1d4a28b2a935e289d3a'
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest `
    -Uri "$frontendUrl/api/auth/login" `
    -Method Post `
    -ContentType 'application/json' `
    -Body $loginBody `
    -SessionVariable demoSession `
    -UseBasicParsing
if ($loginResponse.StatusCode -ne 200) { throw 'Demo account login failed' }

$firstPage = Invoke-WebRequest -Uri "$frontendUrl/work-items" -WebSession $demoSession -UseBasicParsing
$refreshedPage = Invoke-WebRequest -Uri "$frontendUrl/work-items" -WebSession $demoSession -UseBasicParsing
if ($firstPage.StatusCode -ne 200 `
    -or $refreshedPage.StatusCode -ne 200 `
    -or $firstPage.BaseResponse.ResponseUri.AbsolutePath -ne '/work-items' `
    -or $refreshedPage.BaseResponse.ResponseUri.AbsolutePath -ne '/work-items') {
    throw 'Unable to open or refresh /work-items after login'
}

Write-Host ''
Write-Host 'SMOKE CHECK PASSED - all services healthy; Demo login and session persistence work' -ForegroundColor Green
