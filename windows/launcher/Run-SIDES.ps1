$ErrorActionPreference='Stop'
$InstallRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$statePath=Join-Path $InstallRoot 'install-state.json'

function Show-Error([string]$Text){
  try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;[System.Windows.MessageBox]::Show($Text,'CURESP','OK','Error')|Out-Null}catch{}
}
function Test-SidesHealth([string]$Url){
  try{
    $r=Invoke-RestMethod -Uri ($Url+'/api/health') -TimeoutSec 1
    return ($r.ok -eq $true -and $r.app -eq 'SIDES' -and ([string]$r.schema).StartsWith('SIDES-API-'))
  }catch{return $false}
}
function Test-LanguageToolLocal{
  try{$r=Invoke-WebRequest -Uri 'http://127.0.0.1:8081/v2/languages' -UseBasicParsing -TimeoutSec 1;return ($r.StatusCode -eq 200)}catch{return $false}
}
function Get-JavaMajor{
  $java=Get-Command java -ErrorAction SilentlyContinue;if(-not $java){return 0}
  $text=(& java -version 2>&1|Out-String)
  if($text -match 'version\s+"([0-9]+)'){return [int]$Matches[1]}
  if($text -match 'openjdk\s+([0-9]+)'){return [int]$Matches[1]}
  return 0
}
function Configure-OptionalEngines{
  $whisperRoot=Join-Path $InstallRoot 'tools\whisper'
  $whisperCli=Get-ChildItem -LiteralPath $whisperRoot -Filter 'whisper-cli.exe' -File -Recurse -ErrorAction SilentlyContinue|Select-Object -First 1
  $whisperModel=Join-Path $InstallRoot 'models\whisper\ggml-base.bin'
  if($whisperCli -and (Test-Path -LiteralPath $whisperModel)){
    $env:SIDES_WHISPER_BIN=$whisperCli.FullName;$env:SIDES_WHISPER_MODEL=$whisperModel
  }
  $ltRoot=Join-Path $InstallRoot 'tools\languagetool';$ltJar=Join-Path $ltRoot 'languagetool-server.jar'
  if(Test-Path -LiteralPath $ltJar){
    $ready=Test-LanguageToolLocal
    if(-not $ready -and (Get-JavaMajor) -ge 17){
      $java=(Get-Command java).Source
      $args=@('-cp','languagetool-server.jar','org.languagetool.server.HTTPServer','--port','8081','--config','server.properties')
      Start-Process -FilePath $java -ArgumentList $args -WorkingDirectory $ltRoot -WindowStyle Hidden|Out-Null
      for($i=0;$i -lt 15;$i++){Start-Sleep -Milliseconds 300;if(Test-LanguageToolLocal){$ready=$true;break}}
    }
    if($ready){$env:SIDES_LANGUAGETOOL_URL='http://127.0.0.1:8081'}
  }
  $piperModel=Get-ChildItem -LiteralPath (Join-Path $InstallRoot 'models\piper') -Filter '*.onnx' -File -ErrorAction SilentlyContinue|Select-Object -First 1
  if($piperModel){$env:SIDES_PIPER_MODEL=$piperModel.FullName}
}

try{
  if(-not (Test-Path -LiteralPath $statePath)){throw 'Instalacao do CURESP incompleta: install-state.json ausente.'}
  $state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
  if($state.schema -ne 'SIDES-INSTALL-V1'){throw 'Estado de instalacao incompativel.'}
  $current=Join-Path $InstallRoot ([string]$state.current)
  $node=Join-Path $current 'runtime\node.exe'
  $server=Join-Path $current 'src\server.mjs'
  if(-not (Test-Path -LiteralPath $node) -or -not (Test-Path -LiteralPath $server)){throw 'Arquivos da versao ativa nao foram encontrados.'}
  $dataDir=[string]$state.dataDir
  if([string]::IsNullOrWhiteSpace($dataDir)){$dataDir=Join-Path $InstallRoot 'data'}
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null

  $port=4317;$url="http://127.0.0.1:$port"
  if(Test-SidesHealth $url){Start-Process $url;exit 0}
  $occupied=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if($occupied){throw "A porta local $port ja esta em uso por outro programa."}

  Configure-OptionalEngines
  # SIDES_* sao IDs de runtime legados preservados por compatibilidade.
  $env:SIDES_PORT="$port"
  $env:SIDES_DATA_DIR=$dataDir
  $process=Start-Process -FilePath $node -ArgumentList ('"'+$server+'"') -WorkingDirectory $InstallRoot -WindowStyle Hidden -PassThru
  $ready=$false
  for($i=0;$i -lt 40;$i++){
    Start-Sleep -Milliseconds 250
    if($process.HasExited){break}
    if(Test-SidesHealth $url){$ready=$true;break}
  }
  if(-not $ready){
    if(-not $process.HasExited){Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue}
    throw 'O servidor local do CURESP nao iniciou corretamente.'
  }
  Start-Process $url
}catch{
  Show-Error ("Nao foi possivel iniciar o CURESP.`n`n"+$_.Exception.Message)
  exit 1
}
