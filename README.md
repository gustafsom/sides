# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving, fala e gamificação.

## Estado

MVP evolutivo `0.7.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas obrigatórias.

A versão 0.7.0 mantém o currículo A1–B2 expandido e as designações do Bloco 6 e adiciona o **Bloco 7 — fala e escuta offline**, com Whisper local opcional, comparação de fala e histórico de métricas.

## Iniciar

Windows / PowerShell:

```powershell
.\INICIAR-SIDES.ps1
```

Depois, abra `http://127.0.0.1:4317`.

Para habilitar o reconhecimento offline no Windows:

```powershell
.\CONFIGURAR-VOZ-OFFLINE.ps1
```

Whisper é opcional: sem ele, o SIDES continua funcionando e a área de fala oferece comparação por transcrição manual.

## Requisitos

- Node.js 22.13+ (ambiente-alvo Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para treinos de fala;
- `whisper.cpp` somente se desejar transcrição automática local.

## Currículo A1–B2 expandido

O conjunto gerado reúne:

- **1.480** entradas curriculares de vocabulário/expressões;
- **640** frases/chunks;
- **320** exercícios de gramática;
- **200** itens de listening/ditado;
- **104** textos graduados de leitura.

O seed deduplica linhas textualmente idênticas; por isso o dashboard mede o SQLite real contra metas mínimas de **1.200 / 600 / 300 / 200 / 100**. A cobertura permanece distribuída entre A1, A2, B1 e B2, com metadados de nível, tema, dificuldade e pré-requisitos.

## Minhas designações — Bloco 6

A rota `/assignments.html` prepara leitura da Bíblia, comentário, designação de estudante, discurso, apresentação de ministério e outras atividades.

O SIDES registra título, referência curta, data/horário, tempo-alvo, notas próprias, ensaios, confiança, rubricas e prontidão. O plano evolui de fundamentos para construção, ensaio e revisão final. Áudio de ensaio não é persistido.

## Fala e escuta offline — Bloco 7

A rota `/speech.html` oferece:

- shadowing com frases do currículo;
- leitura com trechos originais do SIDES;
- texto próprio temporário para outros treinos;
- gravação pelo navegador;
- conversão local para WAV PCM16 mono 16 kHz;
- transcrição em espanhol com `whisper.cpp`, quando instalado;
- fallback por transcrição manual;
- alinhamento palavra a palavra;
- identificação de omissões, substituições, adições e diferenças apenas de acentuação/grafia;
- palavras por minuto;
- estimativa de pausas, pausas longas e silêncio;
- recomendações concretas de repetição;
- histórico de evolução e domínio adaptativo de fala.

O SIDES trata esses resultados como **indicadores de inteligibilidade e correspondência textual**. Eles não são uma medição científica de fonemas, sotaque ou qualidade clínica da pronúncia, porque o próprio reconhecimento automático pode errar.

### Privacidade da fala

O SQLite armazena apenas métricas agregadas. Não são persistidos:

- áudio;
- blobs de gravação;
- transcrição;
- texto-alvo;
- texto reconhecido.

O WAV usado pelo Whisper passa apenas pelo servidor loopback e por um diretório temporário do sistema operacional, removido após o processamento. O backup inclui as métricas, não o conteúdo falado.

### TTS

Piper possui adaptador local opcional, mas nenhuma voz/modelo é distribuída automaticamente. Sem Piper, o SIDES usa `SpeechSynthesis` e as vozes espanholas do navegador/SO.

Detalhes técnicos: `docs/OFFLINE-SPEECH.md` e `docs/FREE-TOOLS.md`.

## O que já funciona

- diagnóstico inicial A1–B2;
- XP, níveis, sequência, missão diária e conquistas;
- dashboard pedagógico e índice de atenção 0–100;
- FSRS e controle de dívida de revisão;
- vocabulário, chunks, contrastes português ↔ espanhol e falsos cognatos;
- explicações “Entender o correto”;
- gramática contextual;
- listening/ditado;
- leitura graduada;
- sessão diária adaptativa;
- mapa curricular expandido A1–B2;
- Trilha JW;
- Minhas designações com plano, ensaios e prontidão;
- fala offline com Whisper opcional e análise comparativa;
- histórico agregado de correspondência, omissões, substituições, ritmo e pausas;
- backup JSON;
- persistência SQLite local;
- migração aditiva até `SIDES-DB-V6`;
- sub-schema `SIDES-JW-ASSIGNMENTS-V1`;
- sub-schema `SIDES-SPEECH-V1`;
- API local `SIDES-API-V5`;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança, sem CDN ou analytics.

## Trilha JW

A rota `/jw.html` oferece a trilha especializada e integra links para designações e fala offline.

O SIDES **não raspa, copia, armazena, redistribui nem incorpora automaticamente** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org. Quando um treino de leitura usa temporariamente um texto exibido/fornecido pelo usuário, esse texto e sua transcrição não são gravados no histórico.

Detalhes: `docs/JW-TRACK.md`.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/`, binários de voz e modelos locais não são versionados;
- sem conta, token, telemetria ou API paga;
- FSRS é local;
- Whisper é local e opcional;
- Piper é local e opcional;
- gravações/transcrições não entram no banco;
- o caminho funcional básico permanece disponível sem componentes pesados.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migração V2→V6, FSRS, motor adaptativo, currículo A1–B2, Trilha JW, designações, alinhamento de fala, métricas, privacidade do schema/backup, runtime opcional/fail-closed e API local.

Dados reais de estudo, gravações, modelos, binários e backups nunca devem ser adicionados ao Git.
