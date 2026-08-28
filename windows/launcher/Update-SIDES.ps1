param([string]$PackageZip='')
$ErrorActionPreference='Stop'
$InstallRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$statePath=Join-Path $InstallRoot 'install-state.json'

function Show-Message([string]$Text,[string]$Title='SIDES',[string]$Icon='Information'){
  try{Add-Type -AssemblyName PresentationFramework -ErrorAction Stop;[System.Windows.MessageBox]::Show($Text,$Title,'OK',$Icon)|Out-Null}catch{Write-Host $Text}
}
function Select-Package{
  Add-Type -AssemblyName System.Windows.Forms
  $dialog=New-Object System.Windows.Forms.OpenFileDialog
  $dialog.Title='Selecione o pacote de atualizacao do SIDES'
  $dialog.Filter='Pacote SIDES (*.zip)|*.zip'
  $dialog.Multiselect=$false
  if($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){return $dialog.FileName}
  return ''
}
function Test-SidesHealth([string]$Url){
  try{$r=Invoke-RestMethod -Uri ($Url+'/api/health') -TimeoutSec 1;return ($r.ok -eq $true -and $r.app -eq 'SIDES')}catch{return $false}
}

try{
  if(-not (Test-Path -LiteralPath $statePath)){throw 'SIDES_NOT_INSTALLED'}
  if([string]::IsNullOrWhiteSpace($PackageZip)){$PackageZip=Select-Package}
  if([string]::IsNullOrWhiteSpace($PackageZip)){exit 0}
  $PackageZip=[IO.Path]::GetFullPath($PackageZip)
  if(-not (Test-Path -LiteralPath $PackageZip -PathType Leaf)){throw 'UPDATE_PACKAGE_NOT_FOUND'}
  $checksumPath=$PackageZip+'.sha256'
  if(-not (Test-Path -LiteralPath $checksumPath -PathType Leaf)){throw 'UPDATE_EXTERNAL_CHECKSUM_REQUIRED'}
  $declared=((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
  $actual=(Get-FileHash -LiteralPath $PackageZip -Algorithm SHA256).Hash.ToLowerInvariant()
  if($declared -notmatch '^[a-f0-9]{64}$' -or $declared -ne $actual){throw 'UPDATE_PACKAGE_CHECKSUM_MISMATCH'}

  $temp=Join-Path ([IO.Path]::GetTempPath()) ('SIDES-update-'+[Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $temp -Force | Out-Null
  try{
    Expand-Archive -LiteralPath $PackageZip -DestinationPath $temp -Force
    $installer=Join-Path $temp 'INSTALAR-SIDES.ps1'
    $manifestPath=Join-Path $temp 'package-manifest.json'
    if(-not (Test-Path -LiteralPath $installer) -or -not (Test-Path -LiteralPath $manifestPath)){throw 'UPDATE_PACKAGE_LAYOUT_INVALID'}
    $manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if($manifest.schema -ne 'SIDES-WINDOWS-PACKAGE-V1'){throw 'UPDATE_PACKAGE_SCHEMA_INVALID'}
    $state=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $current=[version]([string]$state.version)
    $incoming=[version]([string]$manifest.appVersion)
    if($incoming -le $current){throw "UPDATE_VERSION_NOT_NEWER:$incoming <= $current"}

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer -InstallRoot $InstallRoot -UpdateOnly -NoLaunch
    if($LASTEXITCODE -ne 0){throw 'UPDATE_INSTALL_FAILED'}

    $url='http://127.0.0.1:4317'
    if(Test-SidesHealth $url){
      try{
        $listener=Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 4317 -State Listen -ErrorAction Stop | Select-Object -First 1
        if($listener -and $listener.OwningProcess){Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop;Start-Sleep -Milliseconds 400}
      }catch{}
    }
    $wscript=Join-Path $env:WINDIR 'System32\wscript.exe'
    Start-Process -FilePath $wscript -ArgumentList ('"'+(Join-Path $InstallRoot 'SIDES.vbs')+'"') -WorkingDirectory $InstallRoot | Out-Null
    Show-Message "SIDES atualizado de $current para $incoming.`n`nOs dados permaneceram em sua pasta local e nao foram substituidos." 'SIDES atualizado' 'Information'
  }finally{Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue}
}catch{
  Show-Message ("A atualizacao nao foi aplicada.`n`n"+$_.Exception.Message) 'Falha na atualizacao' 'Error'
  exit 1
}
