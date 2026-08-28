param(
  [string]$InstallRoot = (Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'SIDES'),
  [string]$DataDir = '',
  [switch]$UpdateOnly,
  [switch]$NoLaunch
)
$ErrorActionPreference='Stop'
$PackageRoot=Split-Path -Parent $MyInvocation.MyCommand.Path

function Show-Message([string]$Text,[string]$Title='SIDES',[string]$Icon='Information'){
  try{
    Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
    [System.Windows.MessageBox]::Show($Text,$Title,'OK',$Icon) | Out-Null
  }catch{ Write-Host $Text }
}
function Fail([string]$Message){ throw $Message }
function Sha256([string]$Path){ (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Safe-PackagePath([string]$Relative){
  if([string]::IsNullOrWhiteSpace($Relative)){ Fail 'PACKAGE_PATH_INVALID' }
  $rel=$Relative.Replace('/','\')
  if([IO.Path]::IsPathRooted($rel) -or $rel -match '(^|\\)\.\.(\\|$)'){ Fail 'PACKAGE_PATH_INVALID' }
  $rootFull=[IO.Path]::GetFullPath($PackageRoot).TrimEnd('\')+'\'
  $full=[IO.Path]::GetFullPath((Join-Path $PackageRoot $rel))
  if(-not $full.StartsWith($rootFull,[StringComparison]::OrdinalIgnoreCase)){ Fail 'PACKAGE_PATH_INVALID' }
  return $full
}
function Verify-Package{
  $manifestPath=Join-Path $PackageRoot 'package-manifest.json'
  $manifestShaPath=Join-Path $PackageRoot 'package-manifest.sha256'
  if(-not (Test-Path -LiteralPath $manifestPath) -or -not (Test-Path -LiteralPath $manifestShaPath)){ Fail 'PACKAGE_MANIFEST_MISSING' }
  $declared=((Get-Content -LiteralPath $manifestShaPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
  if($declared -notmatch '^[a-f0-9]{64}$' -or $declared -ne (Sha256 $manifestPath)){ Fail 'PACKAGE_MANIFEST_CHECKSUM_MISMATCH' }
  $manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if($manifest.schema -ne 'SIDES-WINDOWS-PACKAGE-V1' -or $manifest.app -ne 'SIDES' -or $manifest.architecture -ne 'win-x64'){ Fail 'PACKAGE_IDENTITY_INVALID' }
  $files=@($manifest.files)
  if([int]$manifest.fileCount -ne $files.Count){ Fail 'PACKAGE_MANIFEST_COUNT_INVALID' }
  $seen=@{}
  foreach($file in $files){
    $path=[string]$file.path
    if($seen.ContainsKey($path)){ Fail 'PACKAGE_MANIFEST_DUPLICATE' }
    $seen[$path]=$true
    $full=Safe-PackagePath $path
    if(-not (Test-Path -LiteralPath $full -PathType Leaf)){ Fail "PACKAGE_FILE_MISSING:$path" }
    $info=Get-Item -LiteralPath $full
    if([int64]$file.size -ne $info.Length){ Fail "PACKAGE_SIZE_MISMATCH:$path" }
    if(([string]$file.sha256).ToLowerInvariant() -ne (Sha256 $full)){ Fail "PACKAGE_CHECKSUM_MISMATCH:$path" }
  }
  $rootFull=[IO.Path]::GetFullPath($PackageRoot).TrimEnd('\')+'\'
  $actual=@(Get-ChildItem -LiteralPath $PackageRoot -Recurse -File | ForEach-Object {
    $rel=$_.FullName.Substring($rootFull.Length).Replace('\','/')
    if($rel -notin @('package-manifest.json','package-manifest.sha256')){$rel}
  })
  if($actual.Count -ne $files.Count){ Fail 'PACKAGE_FILESET_MISMATCH' }
  foreach($rel in $actual){ if(-not $seen.ContainsKey($rel)){ Fail "PACKAGE_UNEXPECTED_FILE:$rel" } }
  return $manifest
}
function Write-State([string]$Path,$State){
  $temp="$Path.tmp"
  $State | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $temp -Encoding UTF8
  Move-Item -LiteralPath $temp -Destination $Path -Force
}
function New-Shortcut([string]$Path,[string]$Target,[string]$Arguments,[string]$WorkingDirectory){
  $dir=Split-Path -Parent $Path;if($dir){New-Item -ItemType Directory -Path $dir -Force | Out-Null}
  $shell=New-Object -ComObject WScript.Shell
  $shortcut=$shell.CreateShortcut($Path)
  $shortcut.TargetPath=$Target;$shortcut.Arguments=$Arguments;$shortcut.WorkingDirectory=$WorkingDirectory
  $shortcut.Description='SIDES - Sistema de Imersao e Desenvolvimento em Espanhol'
  $shortcut.Save()
}

try{
  if($env:OS -ne 'Windows_NT'){ Fail 'WINDOWS_REQUIRED' }
  $manifest=Verify-Package
  $version=[string]$manifest.appVersion
  if($version -notmatch '^\d+\.\d+\.\d+'){ Fail 'PACKAGE_VERSION_INVALID' }
  $payload=Join-Path $PackageRoot 'payload'
  $runtimeNode=Join-Path $payload 'runtime\node.exe'
  if(-not (Test-Path -LiteralPath $runtimeNode)){ Fail 'PORTABLE_NODE_MISSING' }
  $nodeVersion=(& $runtimeNode -p "process.versions.node").Trim()
  $parts=$nodeVersion.Split('.')
  if(([int]$parts[0] -lt 22) -or (([int]$parts[0] -eq 22) -and ([int]$parts[1] -lt 13))){ Fail "PORTABLE_NODE_TOO_OLD:$nodeVersion" }
  if(-not (Test-Path -LiteralPath (Join-Path $payload 'node_modules\ts-fsrs\package.json'))){ Fail 'FSRS_RUNTIME_MISSING' }

  $InstallRoot=[IO.Path]::GetFullPath($InstallRoot)
  New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
  $versionsDir=Join-Path $InstallRoot 'versions';New-Item -ItemType Directory -Path $versionsDir -Force | Out-Null
  $statePath=Join-Path $InstallRoot 'install-state.json'
  $oldState=$null
  if(Test-Path -LiteralPath $statePath){$oldState=Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json}
  if($UpdateOnly -and -not $oldState){ Fail 'SIDES_NOT_INSTALLED' }

  if([string]::IsNullOrWhiteSpace($DataDir)){
    if($oldState -and $oldState.dataDir){$DataDir=[string]$oldState.dataDir}else{$DataDir=Join-Path $InstallRoot 'data'}
  }
  $DataDir=[IO.Path]::GetFullPath($DataDir);New-Item -ItemType Directory -Path $DataDir -Force | Out-Null

  $target=Join-Path $versionsDir $version
  if(Test-Path -LiteralPath $target){
    $existingPackage=Join-Path $target 'package.json'
    if(-not (Test-Path -LiteralPath $existingPackage)){ Fail 'EXISTING_VERSION_INVALID' }
  }else{
    $tempTarget=Join-Path $versionsDir ('.install-'+[Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempTarget -Force | Out-Null
    try{
      Copy-Item -Path (Join-Path $payload '*') -Destination $tempTarget -Recurse -Force
      Move-Item -LiteralPath $tempTarget -Destination $target
    }catch{Remove-Item -LiteralPath $tempTarget -Recurse -Force -ErrorAction SilentlyContinue;throw}
  }

  foreach($name in @('SIDES.vbs','Run-SIDES.ps1','Atualizar-SIDES.vbs','Update-SIDES.ps1','Desinstalar-SIDES.ps1')){
    Copy-Item -LiteralPath (Join-Path $PackageRoot ('launcher\'+$name)) -Destination (Join-Path $InstallRoot $name) -Force
  }

  $previous=$null
  if($oldState -and $oldState.current -and ([string]$oldState.current -ne ('versions\'+$version))){$previous=[string]$oldState.current}
  elseif($oldState -and $oldState.previous){$previous=[string]$oldState.previous}
  $installedAt=if($oldState -and $oldState.installedAt){[string]$oldState.installedAt}else{(Get-Date).ToUniversalTime().ToString('o')}
  $state=[ordered]@{
    schema='SIDES-INSTALL-V1';version=$version;current=('versions\'+$version);previous=$previous;
    dataDir=$DataDir;installedAt=$installedAt;updatedAt=(Get-Date).ToUniversalTime().ToString('o');architecture='win-x64'
  }
  Write-State $statePath $state

  $wscript=Join-Path $env:WINDIR 'System32\wscript.exe'
  $desktop=[Environment]::GetFolderPath('Desktop')
  $programs=[Environment]::GetFolderPath('Programs')
  New-Shortcut (Join-Path $desktop 'SIDES.lnk') $wscript ('"'+(Join-Path $InstallRoot 'SIDES.vbs')+'"') $InstallRoot
  $menuDir=Join-Path $programs 'SIDES'
  New-Shortcut (Join-Path $menuDir 'SIDES.lnk') $wscript ('"'+(Join-Path $InstallRoot 'SIDES.vbs')+'"') $InstallRoot
  New-Shortcut (Join-Path $menuDir 'Atualizar SIDES.lnk') $wscript ('"'+(Join-Path $InstallRoot 'Atualizar-SIDES.vbs')+'"') $InstallRoot
  $powershell=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
  New-Shortcut (Join-Path $menuDir 'Desinstalar SIDES.lnk') $powershell ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+(Join-Path $InstallRoot 'Desinstalar-SIDES.ps1')+'"') $InstallRoot

  if(-not $NoLaunch){Start-Process -FilePath $wscript -ArgumentList ('"'+(Join-Path $InstallRoot 'SIDES.vbs')+'"') -WorkingDirectory $InstallRoot | Out-Null}
  Show-Message "SIDES $version instalado com sucesso.`n`nAplicacao: $target`nDados preservados em: $DataDir" 'SIDES instalado' 'Information'
  Write-Output "SIDES_INSTALL_OK version=$version root=$InstallRoot data=$DataDir"
  exit 0
}catch{
  $message=$_.Exception.Message
  Show-Message "Nao foi possivel instalar o SIDES.`n`n$message" 'Falha na instalacao' 'Error'
  Write-Error $message
  exit 1
}
