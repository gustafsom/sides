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
| LanguageTool | correção gramatical | zero | escrita local opcional | ativo no Bloco 8; somente loopback |
| Regras SIDES de escrita | revisão conservadora | zero | fallback de escrita | ativo no Bloco 8 |
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

## LanguageTool — Bloco 8

O LanguageTool é **opcional**. A área de escrita funciona sem ele por meio das regras locais conservadoras do SIDES.

A integração segue uma regra de privacidade fail-closed:

- o backend aceita apenas `http://127.0.0.1`, `http://localhost` ou equivalente IPv6 de loopback;
- URLs públicas ou remotas são rejeitadas antes de qualquer requisição;
- o SIDES não usa `api.languagetool.org` para textos do usuário;
- se o servidor local parar, a revisão continua com o fallback SIDES.

O configurador Windows `CONFIGURAR-GRAMATICA-LOCAL.ps1` usa a última versão estável publicada como ZIP antes da migração do projeto para snapshots diários:

- LanguageTool **6.6**;
- arquivo `LanguageTool-6.6.zip`;
- SHA-256 esperado: `53600506b399bb5ffe1e4c8dec794fd378212f14aaf38ccef9b6f89314d11631`;
- Java 17+;
- instalação local em `tools/languagetool/`, ignorada pelo Git.

O launcher inicia o servidor local em `127.0.0.1:8081` quando a instalação está presente. Versões snapshot mais novas podem ser usadas manualmente, desde que executadas localmente e compatíveis com `/v2/check` e `/v2/languages`; elas não são baixadas automaticamente pelo SIDES porque snapshots mutáveis dificultam checksum e reprodutibilidade.

### Limite da correção automática

LanguageTool e regras heurísticas podem gerar falso positivo, deixar erros passar ou não compreender totalmente a intenção pragmática. Por isso:

- o SIDES chama o resultado de **índice de revisão**, não de nota absoluta de proficiência;
- sugestões são apresentadas como apoio à revisão;
- o usuário pode ignorar uma sugestão que não faça sentido no contexto;
- o aprendizado adaptativo prioriza padrões recorrentes e recuperação por reescrita, não apenas quantidade bruta de alertas.

## Privacidade de voz e escrita

### Voz

- gravação fica em memória no navegador;
- WAV enviado ao servidor local fica apenas no loopback;
- o runtime Whisper cria arquivo temporário no diretório temporário do SO e o remove ao finalizar;
- SQLite não armazena áudio, transcrição nem texto-alvo;
- o histórico guarda somente métricas agregadas.

### Escrita

- análise sem salvar não cria tentativa no banco;
- ao registrar uma tentativa, SQLite guarda contagem de palavras/caracteres, índice de revisão, categorias, motor e vínculo de reescrita;
- SQLite não armazena texto produzido, texto corrigido ou sugestões completas;
- o backup mantém essa mesma fronteira e exporta somente métricas/categorias;
- o LanguageTool opcional recebe o texto somente no processo local em loopback.

## Decisões gerais

### Não usar API pública como dependência central

APIs gratuitas de IA, tradução, TTS ou correção podem impor limites, mudar termos ou desaparecer. Elas não entram no caminho crítico.

### Modelos de voz e linguagem

Código open source e modelos podem ter licenças diferentes. O SIDES não redistribui automaticamente modelos sem verificação específica da licença.

### IA generativa

Não é necessária para o núcleo. Se adicionada posteriormente, deverá ser opcional e preservar um caminho funcional local e previsível em custo e privacidade.
