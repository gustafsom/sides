$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Tools = Join-Path $Root "tools"
$Install = Join-Path $Tools "languagetool"
$Jar = Join-Path $Install "languagetool-server.jar"
$Config = Join-Path $Install "server.properties"
$Downloads = Join-Path $env:USERPROFILE "Downloads"
$Zip = Join-Path $Downloads "LanguageTool-6.6.zip"
$Url = "https://languagetool.org/download/LanguageTool-6.6.zip"
$ExpectedSha256 = "53600506b399bb5ffe1e4c8dec794fd378212f14aaf38ccef9b6f89314d11631"

function Get-JavaMajor {
  $java = Get-Command java -ErrorAction SilentlyContinue
  if (-not $java) { return 0 }
  $text = (& java -version 2>&1 | Out-String)
  if ($text -match 'version\s+"([0-9]+)') { return [int]$Matches[1] }
  if ($text -match 'openjdk\s+([0-9]+)') { return [int]$Matches[1] }
  return 0
}

$javaMajor = Get-JavaMajor
if ($javaMajor -lt 17) {
  Write-Host "LanguageTool requer Java 17 ou superior. Java adequado nao foi encontrado." -ForegroundColor Yellow
  Write-Host "Instale gratuitamente Eclipse Temurin 17 JRE/JDK e execute este script novamente:" -ForegroundColor Yellow
  Write-Host "https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Cyan
  exit 2
}

if (-not (Test-Path $Jar)) {
  New-Item -ItemType Directory -Force -Path $Tools | Out-Null
  New-Item -ItemType Directory -Force -Path $Downloads | Out-Null
  if (-not (Test-Path $Zip)) {
    Write-Host "Baixando LanguageTool 6.6 para Downloads..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $Url -OutFile $Zip -UseBasicParsing
  }

  Write-Host "Verificando SHA-256 do LanguageTool..." -ForegroundColor Cyan
  $actual = (Get-FileHash -Path $Zip -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $ExpectedSha256) {
    Write-Host "Checksum invalido. O arquivo nao sera utilizado." -ForegroundColor Red
    Write-Host "Esperado: $ExpectedSha256" -ForegroundColor DarkGray
    Write-Host "Obtido:   $actual" -ForegroundColor DarkGray
    exit 3
  }

  $Extract = Join-Path $Tools "languagetool-extract"
  if (Test-Path $Extract) { Remove-Item $Extract -Recurse -Force }
  if (Test-Path $Install) { Remove-Item $Install -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $Extract | Out-Null
  Write-Host "Extraindo LanguageTool..." -ForegroundColor Cyan
  Expand-Archive -Path $Zip -DestinationPath $Extract -Force
  $Source = Get-ChildItem -Path $Extract -Directory | Where-Object { $_.Name -like 'LanguageTool-*' } | Select-Object -First 1
  if (-not $Source) { throw "Pasta do LanguageTool nao encontrada apos extracao." }
  Move-Item -Path $Source.FullName -Destination $Install
  Remove-Item $Extract -Recurse -Force
}

if (-not (Test-Path $Config)) { New-Item -ItemType File -Path $Config | Out-Null }
Write-Host "LanguageTool preparado em: $Install" -ForegroundColor Green
Write-Host "Checksum oficial validado e arquivos locais fora do Git." -ForegroundColor Green
Write-Host "Ao iniciar o SIDES, o corretor local sera iniciado automaticamente em 127.0.0.1:8081 quando necessario." -ForegroundColor Cyan
