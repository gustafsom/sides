# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving, fala, escrita, imersão e gamificação.

## Estado

MVP evolutivo `0.9.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas obrigatórias.

A versão 0.9.0 preserva currículo A1–B2 expandido, designações, fala offline e escrita inteligente e adiciona o **Bloco 9 — imersão e conversação prática**, com diálogos ramificados, histórias graduadas e respostas por texto ou voz.

## Iniciar

Windows / PowerShell:

```powershell
.\INICIAR-SIDES.ps1
```

Depois, abra `http://127.0.0.1:4317`.

Componentes opcionais:

```powershell
.\CONFIGURAR-VOZ-OFFLINE.ps1
.\CONFIGURAR-GRAMATICA-LOCAL.ps1
```

Whisper e LanguageTool não são necessários para abrir o SIDES. Sem eles, fala continua com comparação manual, escrita mantém as regras locais do SIDES e Imersão continua funcionando por texto.

## Requisitos

- Node.js 22.13+ (ambiente-alvo Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para treinos de fala/conversação oral;
- `whisper.cpp` somente se desejar transcrição automática local;
- Java 17+ somente se desejar LanguageTool local.

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

A rota `/speech.html` oferece shadowing, leitura, gravação local e comparação entre texto-alvo e hipótese reconhecida. `whisper.cpp` é opcional; sem ele, o comparador aceita transcrição manual.

O SIDES identifica omissões, substituições, adições, diferenças de grafia/acentuação, ritmo e pausas como **indicadores de inteligibilidade e correspondência textual**, não como medição científica de sotaque ou fonemas.

SQLite armazena somente métricas agregadas; áudio, transcrição, texto-alvo e texto reconhecido não são persistidos.

Detalhes: `docs/OFFLINE-SPEECH.md`.

## Gramática e escrita inteligente — Bloco 8

A rota `/writing.html` implementa produção guiada/livre e reescrita deliberada. O banco inicial possui **32 propostas originais**, 8 por nível A1/A2/B1/B2.

A revisão combina regras locais SIDES com LanguageTool local opcional. O backend aceita LanguageTool somente em loopback; URLs remotas são bloqueadas antes da chamada. Padrões como concordância, verbos, preposições, ser/estar, por/para, ortografia, acentuação, pontuação, registro e estilo alimentam o motor adaptativo.

`writing_attempts` e `writing_issue_summary` armazenam somente métricas, categorias e vínculo de revisão. Texto escrito/corrigido não é persistido. **Analisar sem salvar** não cria tentativa no banco.

Detalhes: `docs/WRITING.md`.

## Imersão e conversação prática — Bloco 9

A rota `/immersion.html` transforma o currículo em situações de uso real.

O pacote inicial possui:

- **32 cenários ramificados originais**, 8 por nível A1/A2/B1/B2;
- **16 histórias graduadas originais**, 4 por nível;
- contextos de cotidiano, viagem, alimentação, compras, trabalho, saúde, opinião/mídia e congregação.

### Conversação ramificada

Cada turno apresenta um objetivo comunicativo. Você pode responder livremente em espanhol ou usar uma alternativa guiada como apoio. O motor identifica a intenção pela linguagem produzida e avança pelo ramo correspondente.

Se a intenção não for reconhecida, o SIDES **não finge que entendeu**: mantém o turno, explica o objetivo e oferece modelos de reformulação.

A resposta pode ser:

- digitada;
- guiada por uma opção;
- falada, quando Whisper local estiver disponível.

Na resposta oral, o navegador converte a gravação para WAV local, Whisper gera a hipótese de transcrição e somente essa hipótese temporária entra no turno. Áudio/transcrição não são armazenados.

### Sessão imersiva

O botão **Sessão imersiva 15–20 min** monta uma sequência local de:

1. um diálogo ramificado, alvo de 10 minutos;
2. uma história graduada com recuperação de ideias, alvo de 8 minutos.

A meta explícita é manter **pelo menos 85% da produção em espanhol**. Português é reservado para explicações quando necessário.

A seleção considera:

- nível atual;
- conteúdo concluído recentemente;
- contexto escolhido;
- habilidades mais fracas do histórico.

A revisão do Bloco 8 pode analisar transitoriamente a resposta para mostrar pontos linguísticos no próprio turno. Esses textos não entram no banco.

### Histórias graduadas

As histórias exigem leitura contextual e recuperação das ideias com palavras próprias. A resposta é avaliada pela informação comunicada, não por uma única frase literal.

### Evolução e gamificação

Sessões concluídas alimentam `reviews`, `activity`, `skill_mastery` e `skill_events`. O dashboard pode apontar conversação ou um contexto de imersão como ponto de atenção.

Para reduzir repetição apenas por XP, concluir o mesmo conteúdo novamente dentro de sete dias aplica desconto forte de recompensa. A política geral de gamificação será ampliada no Bloco 10.

### Privacidade da imersão

As tabelas `immersion_sessions` e `immersion_turn_metrics` guardam somente:

- conteúdo/cenário utilizado;
- etapa atual;
- modo de entrada;
- número de turnos e palavras;
- êxito comunicativo;
- quantidade de alertas linguísticos;
- índice agregado de revisão;
- score e XP.

Não são persistidos resposta do usuário, transcrição, áudio ou texto produzido. O backup segue a mesma fronteira.

Detalhes: `docs/IMMERSION.md`.

## Trilha JW

A rota `/jw.html` oferece a trilha especializada e integra designações, fala, escrita e Imersão.

Os cenários de congregação do Bloco 9 são conteúdo **original do SIDES** voltado a competências linguísticas — conversar antes/depois da reunião, praticar comentários, apoiar alguém e receber feedback sobre um discurso. O SIDES **não raspa, copia, armazena, redistribui nem incorpora automaticamente** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org.

Detalhes: `docs/JW-TRACK.md`.

## O que já funciona

- diagnóstico inicial A1–B2;
- XP, níveis, sequência, missão diária e conquistas;
- dashboard pedagógico e índice de atenção 0–100;
- FSRS e controle de dívida de revisão;
- vocabulário, chunks, contrastes português ↔ espanhol e falsos cognatos;
- gramática contextual, listening e leitura graduada;
- currículo A1–B2 expandido;
- Trilha JW;
- Minhas designações;
- fala offline com Whisper opcional;
- escrita inteligente com LanguageTool local opcional;
- imersão com 32 diálogos ramificados e 16 histórias;
- resposta imersiva por texto, opção guiada ou voz;
- sessão combinada de aproximadamente 18 minutos;
- seleção adaptativa e reparo comunicativo;
- proteção inicial contra XP por repetição;
- backup JSON;
- persistência SQLite local;
- migração aditiva até `SIDES-DB-V8`;
- sub-schemas `SIDES-JW-ASSIGNMENTS-V1`, `SIDES-SPEECH-V1`, `SIDES-WRITING-V1` e `SIDES-IMMERSION-V1`;
- API local `SIDES-API-V7`;
- export `SIDES-EXPORT-V7`;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança, sem CDN ou analytics.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/`, binários, modelos e LanguageTool local não são versionados;
- sem conta, token, telemetria ou API paga;
- FSRS é local;
- Whisper, Piper e LanguageTool são locais e opcionais;
- áudio/transcrição não entram no banco;
- textos de escrita e respostas de imersão não entram no banco;
- o caminho funcional básico permanece disponível sem componentes pesados.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migração V2→V8, FSRS, motor adaptativo, currículo A1–B2, Trilha JW, designações, fala, escrita, imersão, ramificação/reparo, adaptação, proteção inicial contra XP repetido e privacidade do schema/backup.

Dados reais de estudo, gravações, textos produzidos, respostas de conversa, modelos, binários e backups nunca devem ser adicionados ao Git.
