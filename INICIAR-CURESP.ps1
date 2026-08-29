$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "CURESP requer Node.js 22.13 ou superior." -ForegroundColor Red
  exit 1
}

$versionText = (& node -p "process.versions.node").Trim()
$major = [int]($versionText.Split('.')[0])
$minor = [int]($versionText.Split('.')[1])
if (($major -lt 22) -or (($major -eq 22) -and ($minor -lt 13))) {
  Write-Host "Node.js $versionText detectado. CURESP requer 22.13 ou superior." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $Root "node_modules\ts-fsrs\package.json"))) {
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $npm) {
    Write-Host "O motor FSRS ainda nao foi instalado e o npm nao esta disponivel." -ForegroundColor Red
    exit 1
  }
  Write-Host "Preparando o motor de repeticao espacada FSRS (primeira execucao)..." -ForegroundColor Cyan
  & npm install --ignore-scripts --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Nao foi possivel instalar a dependencia gratuita ts-fsrs. Verifique a conexao e tente novamente." -ForegroundColor Red
    exit 1
  }
}

function Test-LanguageToolLocal {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:8081/v2/languages" -UseBasicParsing -TimeoutSec 1
    return ($r.StatusCode -eq 200)
  } catch { return $false }
}

$ltInstall = Join-Path $Root "tools\languagetool"
$ltJar = Join-Path $ltInstall "languagetool-server.jar"
if (Test-Path $ltJar) {
  $ltReady = Test-LanguageToolLocal
  if (-not $ltReady) {
    $java = Get-Command java -ErrorAction SilentlyContinue
    if ($java) {
      $javaText = (& java -version 2>&1 | Out-String)
      $javaMajor = 0
      if ($javaText -match 'version\s+"([0-9]+)') { $javaMajor = [int]$Matches[1] }
      elseif ($javaText -match 'openjdk\s+([0-9]+)') { $javaMajor = [int]$Matches[1] }
      if ($javaMajor -ge 17) {
        Write-Host "Iniciando corretor gramatical local LanguageTool..." -ForegroundColor Cyan
        $ltArgs = @('-cp','languagetool-server.jar','org.languagetool.server.HTTPServer','--port','8081','--config','server.properties')
        Start-Process -FilePath $java.Source -ArgumentList $ltArgs -WorkingDirectory $ltInstall -WindowStyle Hidden | Out-Null
        for ($i=0; $i -lt 15; $i++) {
          Start-Sleep -Milliseconds 300
          if (Test-LanguageToolLocal) { $ltReady = $true; break }
        }
      }
    }
  }
  if ($ltReady) {
    $env:SIDES_LANGUAGETOOL_URL = "http://127.0.0.1:8081"
    Write-Host "LanguageTool local ativo em 127.0.0.1:8081." -ForegroundColor Green
  } else {
    Write-Host "LanguageTool instalado, mas indisponivel. O CURESP usara o corretor local basico." -ForegroundColor Yellow
  }
}

$port = 4317
$url = "http://127.0.0.1:$port"
Write-Host "Iniciando CURESP em $url" -ForegroundColor Cyan
Write-Host "Dados permanecem nesta maquina. Telemetria desativada." -ForegroundColor DarkGray

# SIDES_PORT e demais SIDES_* sao IDs tecnicos legados preservados para compatibilidade de dados/runtime.
$env:SIDES_PORT = "$port"
$job = Start-Process -FilePath "node" -ArgumentList "src/server.mjs" -WorkingDirectory $Root -PassThru -WindowStyle Normal
Start-Sleep -Milliseconds 900
Start-Process $url
Write-Host "Servidor CURESP iniciado (PID $($job.Id)). Feche a janela do Node para encerrar." -ForegroundColor Green
