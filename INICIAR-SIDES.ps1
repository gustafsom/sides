$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
$Curesp=Join-Path $Root 'INICIAR-CURESP.ps1'
if(-not (Test-Path -LiteralPath $Curesp)){throw 'CURESP_LAUNCHER_MISSING'}
Write-Host 'Este nome de arquivo e um alias de compatibilidade. Iniciando CURESP...' -ForegroundColor DarkGray
& $Curesp
exit $LASTEXITCODE
