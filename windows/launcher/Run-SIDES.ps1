$ErrorActionPreference='Stop'
$InstallRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$statePath=Join-Path $InstallRoot 'install-state.json'

function Show-Error([string]$Text){
  try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;[System.Windows.MessageBox]::Show($Text,'SIDES','OK','Error')|Out-Null}catch{}
}
function Test-SidesHealth([string]$Url){
  try{
    $r=Invoke-RestMethod -Uri ($Url+'/api/health') -TimeoutSec 1
    return ($r.ok -eq $true -and $r.app -eq 'SIDES' -and ([string]$r.schema).StartsWith('SIDES-API-'))
  }catch{return $false}
}

try{
  if(-not (Test-Path -LiteralPath $statePath)){throw 'Instalacao do SIDES incompleta: install-state.json ausente.'}
  $state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
  if($state.schema -ne 'SIDES-INSTALL-V1'){throw 'Estado de instalacao incompatível.'}
  $current=Join-Path $InstallRoot ([string]$state.current)
  $node=Join-Path $current 'runtime\node.exe'
  $server=Join-Path $current 'src\server.mjs'
  if(-not (Test-Path -LiteralPath $node) -or -not (Test-Path -LiteralPath $server)){throw 'Arquivos da versao ativa nao foram encontrados.'}
  $dataDir=[string]$state.dataDir
  if([string]::IsNullOrWhiteSpace($dataDir)){$dataDir=Join-Path $InstallRoot 'data'}
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null

  $port=4317;$url="http://127.0.0.1:$port"
  if(Test-SidesHealth $url){Start-Process $url;exit 0}
  try{
    $occupied=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if($occupied){throw "A porta local $port ja esta em uso por outro programa."}
  }catch [Microsoft.PowerShell.Commands.WriteErrorException] { throw }

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
    throw 'O servidor local do SIDES nao iniciou corretamente.'
  }
  Start-Process $url
}catch{
  Show-Error ("Nao foi possivel iniciar o SIDES.`n`n"+$_.Exception.Message)
  exit 1
}
