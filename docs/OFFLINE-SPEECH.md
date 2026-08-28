# Fala offline — Bloco 7

## Objetivo

O módulo `/speech.html` permite treinar shadowing, leitura e fala baseada em texto com reconhecimento local opcional. O objetivo é transformar a fala em **pistas de estudo acionáveis**, sem depender de API paga e sem armazenar o conteúdo falado.

## Pipeline

1. O navegador grava o microfone com `MediaRecorder`.
2. Web Audio decodifica a gravação, reduz para um canal e reamostra para 16 kHz.
3. O SIDES gera WAV PCM16 no navegador.
4. Quando `whisper.cpp` está disponível, o WAV é enviado somente para `127.0.0.1`.
5. O servidor cria um arquivo temporário, executa `whisper-cli` em espanhol e remove o diretório temporário ao terminar.
6. A hipótese de transcrição é comparada com o texto-alvo.
7. O navegador recebe a comparação e as recomendações.
8. SQLite registra somente métricas agregadas.

Sem Whisper, o usuário pode inserir uma transcrição temporária e executar o mesmo comparador.

## Indicadores

O alinhamento por palavras identifica:

- correspondências;
- diferenças apenas de acento/grafia;
- omissões;
- substituições;
- adições.

A análise do áudio no navegador estima:

- duração;
- palavras por minuto;
- quantidade de pausas;
- pausas longas;
- maior pausa;
- tempo aproximado em silêncio.

Os resultados alimentam habilidades adaptativas de:

- correspondência textual;
- redução de omissões;
- redução de substituições;
- fluência/pausas;
- ritmo.

## Limite de interpretação

O resultado não deve ser tratado como medição científica de pronúncia.

Uma diferença na transcrição pode refletir:

- uma palavra realmente omitida ou produzida de forma pouco inteligível;
- ruído;
- qualidade do microfone;
- limitação do modelo Whisper;
- variante regional;
- erro do próprio reconhecimento automático.

Por isso o SIDES usa expressões como **correspondência textual** e **indicador de inteligibilidade**, e recomenda repetir/escutar/comparar em vez de afirmar que um fonema ou sotaque está errado.

## Privacidade

A tabela `speech_attempts` não contém campos para:

- áudio;
- blob;
- transcrição;
- texto-alvo;
- texto reconhecido.

Ela armazena somente contagens, percentuais, duração, ritmo e pausas. O backup JSON segue a mesma fronteira.

Para a Trilha JW, isso permite usar temporariamente na tela um texto que o usuário está lendo em uma fonte autorizada sem transformar o SIDES em repositório desse conteúdo.

## Instalação opcional do Whisper no Windows

Na raiz do projeto:

```powershell
.\CONFIGURAR-VOZ-OFFLINE.ps1
```

O script:

1. baixa o build x64 verificado do `whisper.cpp`;
2. valida o SHA-256 do ZIP;
3. extrai para `tools/whisper/`;
4. baixa `ggml-base.bin`;
5. valida o SHA-1 oficial do modelo;
6. confirma a presença de `whisper-cli.exe`.

Depois, reinicie o SIDES. A tela `/speech.html` mostrará **Whisper: pronto**.

Também é possível configurar caminhos externos:

- `SIDES_WHISPER_BIN`
- `SIDES_WHISPER_MODEL`

## Piper opcional

Para um ambiente em que o pacote Piper e uma voz devidamente licenciada já estejam instalados, defina:

- `SIDES_PIPER_MODEL`
- opcionalmente `SIDES_PIPER_PYTHON`

O SIDES tenta Piper primeiro. Se ele não estiver configurado ou falhar, a interface usa `SpeechSynthesis` do navegador/SO.

Nenhuma voz Piper é distribuída pelo repositório.

## Falhas esperadas

- `WHISPER_NOT_CONFIGURED`: binário ou modelo ausente;
- `WHISPER_BUSY`: uma transcrição local já está em andamento;
- `WHISPER_TIMEOUT`: processo excedeu o limite;
- `WAV_CONTENT_TYPE_REQUIRED`: chamada inválida da API;
- `WAV_TOO_LARGE`: áudio acima do limite local.

Nenhuma dessas falhas impede o restante do SIDES de funcionar.
