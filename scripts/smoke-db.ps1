#Requires -Version 5.1
<#
.SYNOPSIS
    本機 PostgreSQL 容器的 smoke check：驗證資料庫健康狀態、EF Core migration 與登入種子資料。
.DESCRIPTION
    可重複執行的驗證流程：
      1. 啟動 db 容器並等待 healthcheck 為 healthy。
      2. 透過 dotnet ef 套用 Code First migration（migration 內含 user/admin 種子）。
      3. 以 psql 查詢確認 migration 紀錄與可登入的 user、admin 帳號存在。
    成功時輸出 "SMOKE CHECK PASSED" 並以 exit code 0 結束；任何一步失敗即以非 0 結束。
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# 以腳本所在位置回推專案根目錄，確保無論從何處呼叫都能定位 docker-compose.yml。
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$MigrationId = '20260726143000_CreateUsers'

# 讀取設定：環境變數優先，其次 .env，最後採用與 docker-compose.yml 相同的預設值。
function Get-EnvValue {
    param([string]$Name, [string]$Default)
    $fromProcess = [Environment]::GetEnvironmentVariable($Name)
    if ($fromProcess) { return $fromProcess }
    $envFile = Join-Path $repoRoot '.env'
    if (Test-Path $envFile) {
        $match = Select-String -Path $envFile -Pattern "^\s*$Name\s*=" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($match) { return ($match.Line -replace "^\s*$Name\s*=\s*", '').Trim() }
    }
    return $Default
}

$dbName = Get-EnvValue -Name 'POSTGRES_DB'   -Default 'my_work_item'
$dbUser = Get-EnvValue -Name 'POSTGRES_USER' -Default 'postgres'

function Invoke-Psql {
    param([string]$Sql)
    # 以 stdin 傳入 SQL，避免 PowerShell 在傳遞給原生命令時破壞雙引號識別字。
    $result = $Sql | docker compose exec -T db psql -U $dbUser -d $dbName -tA
    if ($LASTEXITCODE -ne 0) { throw "psql 查詢失敗：$Sql" }
    return ($result | Out-String).Trim()
}

Write-Host '==> 1/4 啟動 PostgreSQL 容器並等待 healthy'
docker compose up db -d --wait
if ($LASTEXITCODE -ne 0) { throw '資料庫容器啟動或健康檢查失敗' }

Write-Host '==> 2/4 確認 healthcheck 狀態'
$containerId = (docker compose ps -q db).Trim()
if (-not $containerId) { throw '找不到 db 容器' }
$health = (docker inspect --format '{{.State.Health.Status}}' $containerId).Trim()
if ($health -ne 'healthy') { throw "資料庫尚未 healthy（目前：$health）" }
Write-Host "    healthy：$containerId"

Write-Host '==> 3/4 套用 EF Core migration（含種子帳號）'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet tool restore
if ($LASTEXITCODE -ne 0) { throw 'dotnet tool restore 失敗' }
dotnet restore backend/91app-backend/91app-backend.csproj
if ($LASTEXITCODE -ne 0) { throw 'dotnet restore 失敗' }
dotnet ef database update --project backend/91app-backend/91app-backend.csproj
if ($LASTEXITCODE -ne 0) { throw 'EF Core migration 套用失敗' }

Write-Host '==> 4/4 驗證 migration 紀錄與登入種子資料'
$migrationHit = Invoke-Psql "SELECT COUNT(*) FROM ""__EFMigrationsHistory"" WHERE ""MigrationId"" = '$MigrationId';"
if ($migrationHit -ne '1') { throw "migration $MigrationId 未套用（命中：$migrationHit）" }
$seedHit = Invoke-Psql "SELECT COUNT(*) FROM ""Users"" WHERE ""Username"" IN ('user', 'admin');"
if ($seedHit -ne '2') { throw "種子帳號不完整（找到 $seedHit / 2）" }

Write-Host ''
Write-Host 'SMOKE CHECK PASSED — 資料庫 healthy、migration 已套用、種子帳號 user/admin 就緒' -ForegroundColor Green
exit 0
