# Ferramentas gratuitas avaliadas

A regra arquitetural é não depender de um serviço cujo “grátis” possa acabar por quota. Por isso, o núcleo utiliza somente componentes locais. Ferramentas externas abaixo são opcionais e devem ser instaladas localmente.

| Ferramenta | Uso previsto | Custo operacional | Papel no SIDES | Observação |
|---|---|---:|---|---|
| Node.js | runtime | zero | núcleo | já compatível com o ambiente SISDEV |
| SQLite / `node:sqlite` | persistência | zero | núcleo | banco fica local |
| Web Speech API / SpeechSynthesis | TTS inicial | zero | MVP | disponibilidade/voz depende do navegador/SO; não é requisito do núcleo |
| MediaRecorder | gravação de fala | zero | MVP | gravação local no navegador |
| FSRS / `ts-fsrs` | repetição espaçada | zero | fase 2 | biblioteca open source; substituirá o SRS simplificado depois da validação do MVP |
| whisper.cpp | reconhecimento de fala | zero | opcional | execução local; custo é apenas CPU/GPU da máquina |
| Piper | síntese de voz | zero | opcional | TTS local; verificar licença de cada modelo de voz antes de distribuí-lo |
| LanguageTool | correção gramatical | zero | opcional | servidor local, evitando API pública e quotas |
| spaCy + modelos ES | NLP | zero | opcional | análise linguística local |

## Decisões

### Não usar API pública como dependência central
APIs gratuitas de IA, tradução, TTS ou correção podem impor limites, mudar termos ou desaparecer. Elas não entram no caminho crítico.

### Modelos de voz e linguagem
Código open source e modelos podem ter licenças diferentes. O SIDES não redistribuirá automaticamente modelos sem uma verificação de licença específica.

### IA generativa
Não é necessária para o MVP. Se adicionada posteriormente, a preferência é execução local e recurso opcional, para preservar previsibilidade de custo e privacidade.
