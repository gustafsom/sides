param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-fA-F]{40}$')][string]$ExactSha
)
$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$ResultRoot=Join-Path $env:USERPROFILE 'Downloads\SISDEV\RESULTADOS\curesp'
$ResultFile=Join-Path $ResultRoot 'CURESP-GATE-safe.json'
$BuildRoot=Join-Path ([IO.Path]::GetTempPath()) ('curesp-sisdev-'+[guid]::NewGuid().ToString('N'))
$checks=[ordered]@{exactSha=$false;cleanTree=$false;tests=$false;security=$false;releaseGate=$false;windowsPackage=$false}

function Write-SafeResult([bool]$Ok,[string]$Code){
  New-Item -ItemType Directory -Path $ResultRoot -Force|Out-Null
  $pkg=Get-Content -LiteralPath (Join-Path $Root 'package.json') -Raw|ConvertFrom-Json
  [ordered]@{
    schema='SISDEV-CURESP-GATE-V1';system='curesp';pipeline='curesp-release-local';mode='READ_ONLY';exactSha=$ExactSha.ToLowerInvariant();
    version=[string]$pkg.version;ok=$Ok;result=$Code;checks=$checks;generatedAt=(Get-Date).ToUniversalTime().ToString('o')
  }|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $ResultFile -Encoding UTF8
}

try{
  $git=Get-Command git -ErrorAction Stop
  $actual=(& $git.Source rev-parse HEAD).Trim().ToLowerInvariant()
  if($actual -ne $ExactSha.ToLowerInvariant()){throw "EXACT_SHA_MISMATCH:$actual"};$checks.exactSha=$true
  $dirty=(& $git.Source status --porcelain | Out-String).Trim()
  if($dirty){throw 'WORKTREE_NOT_CLEAN'};$checks.cleanTree=$true

  $node=Get-Command node -ErrorAction Stop
  $version=(& $node.Source -p 'process.versions.node').Trim().Split('.')
  if(([int]$version[0] -lt 22) -or (([int]$version[0] -eq 22) -and ([int]$version[1] -lt 13))){throw 'NODE_TOO_OLD'}
  if(-not (Test-Path (Join-Path $Root 'node_modules\ts-fsrs\package.json'))){
    & npm install --ignore-scripts --no-audit --no-fund;if($LASTEXITCODE -ne 0){throw 'NPM_INSTALL_FAILED'}
  }
  & npm run check;if($LASTEXITCODE -ne 0){throw 'TEST_GATE_FAILED'};$checks.tests=$true
  & npm run security:check;if($LASTEXITCODE -ne 0){throw 'SECURITY_GATE_FAILED'};$checks.security=$true
  & npm run release:gate;if($LASTEXITCODE -ne 0){throw 'RELEASE_GATE_FAILED'};$checks.releaseGate=$true

  if($env:OS -eq 'Windows_NT'){
    & (Join-Path $Root 'BUILD-WINDOWS-PACKAGE.ps1') -OutputDir $BuildRoot
    if($LASTEXITCODE -ne 0){throw 'WINDOWS_PACKAGE_GATE_FAILED'};$checks.windowsPackage=$true
  }else{throw 'WINDOWS_LOCAL_GATE_REQUIRED'}

  Write-SafeResult $true 'PASS'
  Write-Host "CURESP gate aprovado para o SHA exato $ExactSha" -ForegroundColor Green
  Write-Host "Resultado sanitizado: %USERPROFILE%\Downloads\SISDEV\RESULTADOS\curesp\CURESP-GATE-safe.json" -ForegroundColor Cyan
  exit 0
}catch{
  Write-SafeResult $false $_.Exception.Message
  Write-Error ("CURESP gate falhou: "+$_.Exception.Message)
  exit 1
}finally{Remove-Item -LiteralPath $BuildRoot -Recurse -Force -ErrorAction SilentlyContinue}
