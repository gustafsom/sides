# Ferramentas gratuitas avaliadas

A regra arquitetural é não depender de um serviço cujo “grátis” possa acabar por quota. O núcleo utiliza componentes locais; ferramentas externas mais pesadas continuam opcionais.

| Ferramenta | Uso | Custo operacional | Papel no SIDES | Situação |
|---|---|---:|---|---|
| Node.js | runtime | zero | núcleo | ativo |
| SQLite / `node:sqlite` | persistência | zero | núcleo | ativo |
| `ts-fsrs` **5.4.1** | repetição espaçada | zero | núcleo adaptativo | ativo; versão fixada |
| Web Speech API / SpeechSynthesis | TTS | zero | fallback local/SO | ativo |
| MediaRecorder + Web Audio | gravação/conversão/análise de pausas | zero | fala | ativo |
| `whisper.cpp` | reconhecimento de fala | zero | ASR local opcional | ativo no Bloco 7 |
| Piper | síntese de voz | zero | TTS local opcional | adaptador ativo; modelo/voz não incluído |
| LanguageTool | correção gramatical | zero | opcional | Bloco 8 |
| spaCy + modelos ES | NLP | zero | opcional | futuro |

## FSRS

O SIDES usa `ts-fsrs@5.4.1` com execução local e versão exata no `package.json`.

Decisões:

- retenção-alvo inicial de 90%;
- intervalo máximo de 3650 dias;
- fuzz habilitado;
- passos curtos de aprendizagem/reaprendizagem;
- estado legado do scheduler V1 é convertido quando o item é revisado, sem zerar progresso existente;
- retrievability é indicador, não garantia de memória individual.

## whisper.cpp — Bloco 7

O reconhecimento de fala é **opcional**. O SIDES abre e funciona normalmente sem Whisper.

O script `CONFIGURAR-VOZ-OFFLINE.ps1` usa uma versão explicitamente verificada para tornar a instalação reproduzível:

- projeto: `ggml-org/whisper.cpp`, licença MIT;
- build Windows x64: release/build `b4938`, publicada em 20/08/2026;
- arquivo: `whisper-bin-x64.zip`;
- SHA-256 esperado: `c2a4b60edb11f7e11a9191ffb50929535527d4d91c9903dbe3e554583bbbc63d`;
- modelo multilíngue: `ggml-base.bin`, aproximadamente 142 MiB;
- SHA-1 esperado do modelo: `465707469ff3a37a2b9b8d8f89f2f99de7299dac`.

O áudio do navegador é convertido pelo próprio SIDES para WAV PCM16 mono 16 kHz. Portanto o caminho padrão do Bloco 7 não requer FFmpeg.

O binário e o modelo ficam em `tools/whisper/` e `models/whisper/`, ambos ignorados pelo Git.

### Limite da avaliação

Whisper produz uma **hipótese de transcrição** e também pode errar. O SIDES compara essa hipótese com o texto-alvo para gerar indicadores de correspondência/inteligibilidade, omissões, substituições, adições, ritmo e pausas. Isso **não** é uma medição científica de fonemas, sotaque ou proficiência clínica de pronúncia.

## Piper

O adaptador Piper existe, mas nenhum modelo/voz é baixado ou redistribuído automaticamente.

Motivos:

- o projeto Piper atual utiliza GPL-3.0;
- cada voz/modelo pode ter licença própria;
- uma voz só deve ser adicionada depois de verificar sua licença específica.

Quando Piper não estiver configurado, o SIDES continua usando `SpeechSynthesis` e as vozes espanholas disponíveis no navegador/SO.

## Privacidade de voz

- gravação fica em memória no navegador;
- WAV enviado ao servidor local fica apenas no loopback;
- o runtime Whisper cria arquivo temporário no diretório temporário do SO e o remove ao finalizar;
- SQLite não armazena áudio, transcrição nem texto-alvo;
- o histórico guarda somente métricas agregadas;
- modelos e binários locais não entram no backup de progresso.

## Decisões gerais

### Não usar API pública como dependência central

APIs gratuitas de IA, tradução, TTS ou correção podem impor limites, mudar termos ou desaparecer. Elas não entram no caminho crítico.

### Modelos de voz e linguagem

Código open source e modelos podem ter licenças diferentes. O SIDES não redistribui automaticamente modelos sem verificação específica da licença.

### IA generativa

Não é necessária para o núcleo. Se adicionada posteriormente, deverá ser opcional e preservar um caminho funcional local e previsível em custo e privacidade.
