$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "SIDES requer Node.js 22.13 ou superior." -ForegroundColor Red
  exit 1
}

$versionText = (& node -p "process.versions.node").Trim()
$major = [int]($versionText.Split('.')[0])
$minor = [int]($versionText.Split('.')[1])
if (($major -lt 22) -or (($major -eq 22) -and ($minor -lt 13))) {
  Write-Host "Node.js $versionText detectado. SIDES requer 22.13 ou superior." -ForegroundColor Red
  exit 1
}

$port = 4317
$url = "http://127.0.0.1:$port"
Write-Host "Iniciando SIDES em $url" -ForegroundColor Cyan
Write-Host "Dados permanecem nesta maquina. Telemetria desativada." -ForegroundColor DarkGray

$env:SIDES_PORT = "$port"
$job = Start-Process -FilePath "node" -ArgumentList "src/server.mjs" -WorkingDirectory $Root -PassThru -WindowStyle Normal
Start-Sleep -Milliseconds 900
Start-Process $url
Write-Host "Servidor iniciado (PID $($job.Id)). Feche a janela do Node para encerrar." -ForegroundColor Green
