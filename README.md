# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving e gamificação.

## Estado

MVP evolutivo `0.5.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas.

O Bloco 5 transforma o conteúdo inicial em um **currículo A1–B2 de uso prolongado**, mantendo o motor adaptativo/FSRS do Bloco 4 e a Trilha JW.

## Iniciar

Windows / PowerShell:

```powershell
.\INICIAR-SIDES.ps1
```

Na primeira execução do código-fonte, se necessário, o launcher instala a dependência fixada `ts-fsrs@5.4.1`. Depois, abra `http://127.0.0.1:4317`.

## Requisitos

- Node.js 22.13+ (o ambiente-alvo usa Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para gravação de shadowing/leitura/discurso.

## Currículo A1–B2

O pacote do Bloco 5 adiciona conteúdo próprio e original:

- **640** entradas curriculares de vocabulário;
- **320** frases/chunks;
- **160** exercícios de gramática;
- **100** itens de listening/ditado;
- **52** textos graduados de leitura;
- cobertura equilibrada entre **A1, A2, B1 e B2**;
- temas de rotina, cidade, viagem, trabalho, saúde, relações, comunicação, projetos, ambiente, argumentação, aprendizagem e contextos congregacionais;
- metadados por item: nível, tema, dificuldade e pré-requisitos.

Os pré-requisitos são usados como **sinal de prontidão**, não como bloqueio rígido. O SIDES prioriza conteúdos cuja base já esteja mais firme, mas mantém liberdade para adaptação pelo desempenho real.

O painel inclui um **Mapa do currículo A1–B2**, com metas, quantidade disponível por nível e distribuição por temas.

## O que já funciona

- diagnóstico inicial A1–B2;
- painel com XP, nível, sequência, precisão, erros abertos e revisões vencidas;
- dashboard pedagógico com evolução em 30 dias, tendência semanal, retenção estimada, dívida de revisão e prioridades;
- índice de atenção 0–100 por habilidade;
- ação **Treinar** diretamente no ponto fraco identificado;
- missão diária gamificada;
- vocabulário com recuperação ativa e **FSRS**;
- frases/chunks como unidades de recuperação;
- contraste português ↔ espanhol e falsos cognatos;
- explicação “Entender o correto” quando há erro ou dificuldade;
- gramática em contexto com correção, explicação e treino direcionado;
- ditado/listening usando voz espanhola disponível no navegador/SO;
- leitura com perguntas de recuperação;
- shadowing com gravação local do microfone;
- sessão diária intercalando habilidades e priorizando pontos fracos;
- redução temporária de conteúdo novo quando a dívida de revisões antigas fica alta;
- mapa de domínio por habilidade e caderno de erros aberto até recuperação correta;
- variante de espanhol configurável;
- Trilha JW para vocabulário congregacional/bíblico, livros e abreviações da Bíblia, leitura pública, comentários e discursos;
- links para recursos oficiais do JW.org, sem copiar conteúdo para o SIDES;
- backup JSON do progresso;
- persistência SQLite local;
- migração aditiva até `SIDES-DB-V4`, preservando dados e estados de revisão existentes;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança; sem CDN ou analytics.

## Como o motor adaptativo funciona

### FSRS

Novas revisões usam `ts-fsrs@5.4.1`. Estados antigos do scheduler simplificado são convertidos quando o item volta a ser revisado, sem zerar histórico, repetições, lapses ou intervalos existentes.

### Pontos que precisam de atenção

O SIDES calcula prioridade considerando domínio estimado, erros ainda não recuperados, erros recentes, tendência, tempo desde a última prática e quantidade de evidências.

### Currículo e prontidão

Cada conteúdo do Bloco 5 possui metadados curriculares. Para conteúdo avançado, o SIDES consulta o domínio das habilidades-base e usa isso na ordenação adaptativa. Ausência de histórico não impede o estudo: apenas reduz levemente a prioridade até existirem evidências melhores.

## Trilha JW

A rota local `/jw.html` oferece uma trilha especializada para espanhol usado em congregação, leitura bíblica, comentários e discursos.

O SIDES **não raspa, copia, armazena, redistribui nem incorpora** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org. Conteúdo oficial continua no JW.org/JW Library; o SIDES registra somente dados do treino e progresso.

Detalhes: `docs/JW-TRACK.md`.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/` não é versionado;
- sem conta, token, telemetria ou API paga;
- `ts-fsrs` é executado localmente;
- voz gravada no MVP não é enviada a serviços externos;
- módulos futuros de voz/NLP continuam opt-in e locais.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migrações, FSRS, motor adaptativo, Trilha JW, currículo A1–B2, idempotência de seed, progressão por nível e segurança básica do servidor.

Dados reais de estudo, gravações e backups nunca devem ser adicionados ao Git.