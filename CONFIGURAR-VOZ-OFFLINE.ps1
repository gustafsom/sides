$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Tools = Join-Path $Root 'tools\whisper'
$Models = Join-Path $Root 'models\whisper'
$Temp = Join-Path ([IO.Path]::GetTempPath()) ('sides-whisper-' + [guid]::NewGuid().ToString('N'))
$Zip = Join-Path $Temp 'whisper-bin-x64.zip'
$Model = Join-Path $Models 'ggml-base.bin'

# whisper.cpp official x64 build published 2026-08-20 (b4938).
$WhisperUrl = 'https://github.com/ggml-org/whisper.cpp/releases/download/b4938/whisper-bin-x64.zip'
$WhisperSha256 = 'c2a4b60edb11f7e11a9191ffb50929535527d4d91c9903dbe3e554583bbbc63d'
# Official multilingual base GGML model. SHA-1 published in whisper.cpp/models/README.md.
$ModelUrl = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin'
$ModelSha1 = '465707469ff3a37a2b9b8d8f89f2f99de7299dac'

function Assert-Hash([string]$Path,[string]$Algorithm,[string]$Expected) {
    $actual = (Get-FileHash -Path $Path -Algorithm $Algorithm).Hash.ToLowerInvariant()
    if ($actual -ne $Expected.ToLowerInvariant()) { throw "Checksum inválido em $Path. Esperado $Expected; obtido $actual." }
}

try {
    New-Item -ItemType Directory -Force -Path $Temp,$Tools,$Models | Out-Null
    Write-Host 'SIDES - Configuração da fala offline' -ForegroundColor Cyan
    Write-Host 'Baixando binário oficial do whisper.cpp...'
    Invoke-WebRequest -Uri $WhisperUrl -OutFile $Zip -UseBasicParsing
    Assert-Hash $Zip 'SHA256' $WhisperSha256
    Remove-Item -Recurse -Force $Tools -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $Tools | Out-Null
    Expand-Archive -Path $Zip -DestinationPath $Tools -Force

    if (-not (Test-Path $Model)) {
        Write-Host 'Baixando modelo multilíngue base (~142 MiB)...'
        Invoke-WebRequest -Uri $ModelUrl -OutFile $Model -UseBasicParsing
    }
    Assert-Hash $Model 'SHA1' $ModelSha1

    $cli = Get-ChildItem -Path $Tools -Filter 'whisper-cli.exe' -File -Recurse | Select-Object -First 1
    if (-not $cli) { throw 'whisper-cli.exe não foi localizado após a extração.' }

    Write-Host ''
    Write-Host 'Whisper offline configurado com sucesso.' -ForegroundColor Green
    Write-Host "CLI: $($cli.FullName)"
    Write-Host "Modelo: $Model"
    Write-Host 'Reinicie o SIDES e abra Fala offline.'
    Write-Host 'Nenhum áudio é enviado a serviços externos.'
}
finally {
    Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue
}
