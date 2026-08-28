param([switch]$RemoveData)
$ErrorActionPreference='Stop'
$InstallRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
function Ask([string]$Text){
  try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;return ([System.Windows.MessageBox]::Show($Text,'SIDES','YesNo','Question') -eq 'Yes')}catch{return $false}
}
function Info([string]$Text){try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;[System.Windows.MessageBox]::Show($Text,'SIDES','OK','Information')|Out-Null}catch{}}
try{
  if(-not (Ask 'Deseja desinstalar o SIDES? Seus dados de estudo serao preservados por padrao.')){exit 0}
  $dataDir=Join-Path $InstallRoot 'data'
  $statePath=Join-Path $InstallRoot 'install-state.json'
  if(Test-Path -LiteralPath $statePath){
    try{$state=Get-Content -LiteralPath $statePath -Raw|ConvertFrom-Json;if($state.dataDir){$dataDir=[string]$state.dataDir}}catch{}
  }
  try{
    $r=Invoke-RestMethod -Uri 'http://127.0.0.1:4317/api/health' -TimeoutSec 1
    if($r.app -eq 'SIDES'){
      $listener=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue|Select-Object -First 1
      if($listener.OwningProcess){Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue}
    }
  }catch{}
  Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Desktop')) 'SIDES.lnk') -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Programs')) 'SIDES') -Recurse -Force -ErrorAction SilentlyContinue
  foreach($name in @('versions','SIDES.vbs','Run-SIDES.ps1','Atualizar-SIDES.vbs','Update-SIDES.ps1','Desinstalar-SIDES.ps1','CONFIGURAR-VOZ-OFFLINE.ps1','CONFIGURAR-GRAMATICA-LOCAL.ps1','install-state.json')){
    Remove-Item -LiteralPath (Join-Path $InstallRoot $name) -Recurse -Force -ErrorAction SilentlyContinue
  }
  if($RemoveData){
    if(Ask 'Confirmar exclusao definitiva dos dados, backups e historico local do SIDES?'){Remove-Item -LiteralPath $dataDir -Recurse -Force -ErrorAction SilentlyContinue}
  }
  Info ("SIDES desinstalado.`n`nDados preservados em: $dataDir")
}catch{Info ("Nao foi possivel concluir a desinstalacao.`n`n"+$_.Exception.Message);exit 1}
