param(
  [string]$OutputDir = 'dist',
  [string]$NodePath = ''
)
$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Fail([string]$Message){throw $Message}
if($env:OS -ne 'Windows_NT'){Fail 'WINDOWS_REQUIRED'}
if([string]::IsNullOrWhiteSpace($NodePath)){
  $node=Get-Command node -ErrorAction SilentlyContinue
  if(-not $node){Fail 'NODE_REQUIRED_TO_BUILD'}
  $NodePath=$node.Source
}
$NodePath=[IO.Path]::GetFullPath($NodePath)
$nodeVersion=(& $NodePath -p "process.versions.node").Trim()
$parts=$nodeVersion.Split('.')
if(([int]$parts[0] -lt 22) -or (([int]$parts[0] -eq 22) -and ([int]$parts[1] -lt 13))){Fail "NODE_TOO_OLD:$nodeVersion"}

$package=Get-Content -LiteralPath (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json
$version=[string]$package.version
if($version -notmatch '^\d+\.\d+\.\d+$'){Fail "PACKAGE_VERSION_INVALID:$version"}
if(-not (Test-Path -LiteralPath (Join-Path $Root 'node_modules\ts-fsrs\package.json'))){
  $npm=Get-Command npm -ErrorAction SilentlyContinue
  if(-not $npm){Fail 'NPM_REQUIRED_FOR_BUILD_DEPENDENCIES'}
  & npm install --ignore-scripts --no-audit --no-fund
  if($LASTEXITCODE -ne 0){Fail 'NPM_INSTALL_FAILED'}
}

if([IO.Path]::IsPathRooted($OutputDir)){
  $out=[IO.Path]::GetFullPath($OutputDir)
}else{
  $out=[IO.Path]::GetFullPath((Join-Path $Root $OutputDir))
}
New-Item -ItemType Directory -Path $out -Force | Out-Null
$stage=Join-Path $out ("CURESP-$version-windows-x64-stage")
$zip=Join-Path $out ("CURESP-$version-windows-x64.zip")
$zipSha=$zip+'.sha256'
Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $zip,$zipSha -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage -Force | Out-Null
$payload=Join-Path $stage 'payload';New-Item -ItemType Directory -Path $payload -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $Root 'src') -Destination $payload -Recurse
Copy-Item -LiteralPath (Join-Path $Root 'public') -Destination $payload -Recurse
Copy-Item -LiteralPath (Join-Path $Root 'package.json') -Destination $payload
Copy-Item -LiteralPath (Join-Path $Root 'THIRD_PARTY_NOTICES.md') -Destination $payload
New-Item -ItemType Directory -Path (Join-Path $payload 'node_modules') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $Root 'node_modules\ts-fsrs') -Destination (Join-Path $payload 'node_modules\ts-fsrs') -Recurse
New-Item -ItemType Directory -Path (Join-Path $payload 'runtime') -Force | Out-Null
Copy-Item -LiteralPath $NodePath -Destination (Join-Path $payload 'runtime\node.exe')

$nodeDir=Split-Path -Parent $NodePath
$nodeLicense=$null
foreach($candidate in @('LICENSE','LICENSE.txt','LICENSE.md')){
  $p=Join-Path $nodeDir $candidate
  if(Test-Path -LiteralPath $p -PathType Leaf){$nodeLicense=$p;break}
}
if(-not $nodeLicense){Fail 'NODE_LICENSE_MISSING'}
Copy-Item -LiteralPath $nodeLicense -Destination (Join-Path $payload 'runtime\NODE-LICENSE.txt')

# O instalador interno mantém o nome legado para compatibilidade com testes/update da 1.0,
# enquanto CURESP é a entrada oficial exibida ao usuário.
Copy-Item -LiteralPath (Join-Path $Root 'windows\INSTALAR-SIDES.ps1') -Destination (Join-Path $stage 'INSTALAR-SIDES.ps1')
Copy-Item -LiteralPath (Join-Path $Root 'windows\INSTALAR-SIDES.ps1') -Destination (Join-Path $stage 'INSTALAR-CURESP.ps1')
Copy-Item -LiteralPath (Join-Path $Root 'windows\INSTALAR-SIDES.vbs') -Destination (Join-Path $stage 'INSTALAR-SIDES.vbs')
Copy-Item -LiteralPath (Join-Path $Root 'windows\INSTALAR-CURESP.vbs') -Destination (Join-Path $stage 'INSTALAR-CURESP.vbs')
Copy-Item -LiteralPath (Join-Path $Root 'windows\launcher') -Destination (Join-Path $stage 'launcher') -Recurse
Copy-Item -LiteralPath (Join-Path $Root 'CONFIGURAR-VOZ-OFFLINE.ps1') -Destination (Join-Path $stage 'launcher\CONFIGURAR-VOZ-OFFLINE.ps1')
Copy-Item -LiteralPath (Join-Path $Root 'CONFIGURAR-GRAMATICA-LOCAL.ps1') -Destination (Join-Path $stage 'launcher\CONFIGURAR-GRAMATICA-LOCAL.ps1')

& $NodePath (Join-Path $Root 'scripts\generate-windows-manifest.mjs') $stage $version
if($LASTEXITCODE -ne 0){Fail 'PACKAGE_MANIFEST_FAILED'}

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal
$hash=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath $zipSha -Value ("$hash *"+[IO.Path]::GetFileName($zip)) -Encoding ASCII

Write-Host "Pacote CURESP Windows criado." -ForegroundColor Green
Write-Host "Versao: $version | Node portatil: $nodeVersion" -ForegroundColor DarkGray
Write-Host "ZIP: $zip" -ForegroundColor Cyan
Write-Host "SHA-256: $hash" -ForegroundColor Cyan
Write-Output "CURESP_PACKAGE_OK zip=$zip sha256=$hash version=$version"
