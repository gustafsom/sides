import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Immersion explains optional Whisper inline instead of blocking the learner with an alert',()=>{
  const html=read('public/immersion.html');
  const js=read('public/immersion.js');
  assert.match(html,/id="voiceSetup"/);
  assert.match(html,/Menu Iniciar → CURESP → Configurar voz offline/);
  assert.match(js,/Voz offline ainda não está configurada/);
  assert.match(js,/Você pode continuar este turno por texto/);
  assert.doesNotMatch(js,/return alert\(['"]Whisper local não está configurado/);
});

test('microphone failures are separated from speech-engine configuration failures',()=>{
  const immersion=read('public/immersion.js');
  const speech=read('public/speech.js');
  for(const source of [immersion,speech]){
    assert.match(source,/NotAllowedError/);
    assert.match(source,/NotFoundError/);
    assert.match(source,/NotReadableError/);
    assert.match(source,/127\.0\.0\.1/);
  }
});

test('CURESP keeps audio local and does not silently fall back to remote browser speech recognition',()=>{
  const immersion=read('public/immersion.js');
  const speech=read('public/speech.js');
  assert.doesNotMatch(immersion,/SpeechRecognition|webkitSpeechRecognition/);
  assert.doesNotMatch(speech,/SpeechRecognition|webkitSpeechRecognition/);
  assert.match(immersion,/\/api\/speech\/transcribe/);
  assert.match(speech,/\/api\/speech\/transcribe/);
});

test('offline voice setup validates downloads and only restarts a verified CURESP local server',()=>{
  const setup=read('CONFIGURAR-VOZ-OFFLINE.ps1');
  assert.match(setup,/CURESP - Configuração da voz offline/);
  assert.match(setup,/Assert-Hash \$Zip 'SHA256'/);
  assert.match(setup,/Assert-Hash \$Model 'SHA1'/);
  assert.match(setup,/Test-CurespHealth/);
  assert.match(setup,/if \(Test-CurespHealth \$url\)/);
  assert.match(setup,/Get-NetTCPConnection -LocalAddress '127\.0\.0\.1' -LocalPort 4317/);
  assert.match(setup,/CURESP\.vbs/);
  assert.match(setup,/CURESP reiniciado automaticamente/);
  assert.doesNotMatch(setup,/SIDES - Configuração da fala offline/);
});

test('speech screen disables automatic analysis when Whisper is not ready and exposes manual fallback',()=>{
  const js=read('public/speech.js');
  const html=read('public/speech.html');
  assert.match(js,/\$\('#analyze'\)\.disabled=!runtime\?\.whisper\?\.ready/);
  assert.match(js,/Menu Iniciar → CURESP → Configurar voz offline/);
  assert.match(html,/Fallback sem Whisper/);
});
