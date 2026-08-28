param([switch]$NoLaunch,[switch]$Force)
$ErrorActionPreference='Stop'
$InstallRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$statePath=Join-Path $InstallRoot 'install-state.json'

function Show-Message([string]$Text,[string]$Title='SIDES',[string]$Icon='Information'){
  try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;[System.Windows.MessageBox]::Show($Text,$Title,'OK',$Icon)|Out-Null}catch{Write-Host $Text}
}
function Confirm-Rollback([string]$From,[string]$To){
  if($Force){return $true}
  try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;return ([System.Windows.MessageBox]::Show("Restaurar a versão anterior do SIDES?`n`nAtual: $From`nAnterior: $To`n`nSeus dados de estudo não serão alterados.",'SIDES - Restaurar versão','YesNo','Question') -eq 'Yes')}catch{return $false}
}
function Write-State([string]$Path,$State){
  $tmp="$Path.tmp";$State|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $tmp -Encoding UTF8;Move-Item -LiteralPath $tmp -Destination $Path -Force
}
function Stop-Sides{
  try{
    $r=Invoke-RestMethod -Uri 'http://127.0.0.1:4317/api/health' -TimeoutSec 1
    if($r.app -eq 'SIDES'){
      $listener=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue|Select-Object -First 1
      if($listener -and $listener.OwningProcess){Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue}
    }
  }catch{}
}

try{
  if(-not (Test-Path -LiteralPath $statePath)){throw 'SIDES_NOT_INSTALLED'}
  $state=Get-Content -LiteralPath $statePath -Raw|ConvertFrom-Json
  if($state.schema -ne 'SIDES-INSTALL-V1'){throw 'INSTALL_STATE_INVALID'}
  $current=[string]$state.current;$previous=[string]$state.previous
  if([string]::IsNullOrWhiteSpace($previous)){throw 'ROLLBACK_VERSION_NOT_AVAILABLE'}
  $previousDir=Join-Path $InstallRoot $previous
  $previousPackage=Join-Path $previousDir 'package.json'
  if(-not (Test-Path -LiteralPath $previousPackage)){throw 'ROLLBACK_VERSION_INVALID'}
  $previousVersion=[string](Get-Content -LiteralPath $previousPackage -Raw|ConvertFrom-Json).version
  if($previousVersion -notmatch '^\d+\.\d+\.\d+'){throw 'ROLLBACK_VERSION_INVALID'}
  if(-not (Confirm-Rollback ([string]$state.version) $previousVersion)){exit 0}
  Stop-Sides
  $new=[ordered]@{
    schema='SIDES-INSTALL-V1';version=$previousVersion;current=$previous;previous=$current;dataDir=[string]$state.dataDir;
    installedAt=[string]$state.installedAt;updatedAt=(Get-Date).ToUniversalTime().ToString('o');architecture='win-x64'
  }
  Write-State $statePath $new
  if(-not $NoLaunch){
    $wscript=Join-Path $env:WINDIR 'System32\wscript.exe';Start-Process -FilePath $wscript -ArgumentList ('"'+(Join-Path $InstallRoot 'SIDES.vbs')+'"') -WorkingDirectory $InstallRoot|Out-Null
  }
  Show-Message "SIDES restaurado para a versão $previousVersion.`n`nA pasta de dados não foi modificada." 'Rollback concluído' 'Information'
  Write-Output "SIDES_ROLLBACK_OK version=$previousVersion"
}catch{Show-Message ("Não foi possível restaurar a versão anterior.`n`n"+$_.Exception.Message) 'Falha no rollback' 'Error';Write-Error $_.Exception.Message;exit 1}
