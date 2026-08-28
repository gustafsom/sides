# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, fala, escrita, imersão, planejamento adaptativo e proteção local do progresso.

## Estado

MVP evolutivo `0.11.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas obrigatórias.

A versão 0.11.0 preserva os Blocos 1–10 e adiciona o **Bloco 11 — Integridade, backup e recuperação**: backup SQLite automático e rotativo, validação de integridade, exportação/importação completas, restauração segura no reinício e logs técnicos locais com retenção.

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

Whisper e LanguageTool não são necessários para abrir o SIDES. Sem eles, fala continua com comparação manual, escrita mantém as regras locais e Imersão funciona por texto.

## Requisitos

- Node.js 22.13+ (ambiente-alvo Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para fala/conversação oral;
- `whisper.cpp` opcional para transcrição local;
- Java 17+ apenas para LanguageTool local.

## Currículo A1–B2 expandido

O conjunto gerado reúne **1.480** entradas lexicais/expressões, **640** frases/chunks, **320** exercícios de gramática, **200** itens de listening e **104** textos graduados. O seed deduplica linhas textualmente idênticas e o dashboard mede o SQLite real contra metas mínimas de **1.200 / 600 / 300 / 200 / 100**.

## Bloco 6 — Minhas designações

`/assignments.html` prepara leitura da Bíblia, comentário, designação de estudante, discurso, apresentação de ministério e outras atividades. Registra referência curta, prazo, tempo-alvo, ensaios, confiança, rubricas e prontidão; áudio não é persistido.

## Bloco 7 — Fala e escuta offline

`/speech.html` oferece shadowing, leitura, gravação local e comparação textual. `whisper.cpp` é opcional. Áudio, transcrição e texto-alvo não são persistidos.

Detalhes: `docs/OFFLINE-SPEECH.md`.

## Bloco 8 — Gramática e escrita inteligente

`/writing.html` oferece produção guiada/livre e reescrita deliberada. Regras SIDES funcionam sempre; LanguageTool local é opcional e endpoints remotos são bloqueados. O banco guarda métricas e categorias, nunca o texto produzido/corrigido.

Detalhes: `docs/WRITING.md`.

## Bloco 9 — Imersão e conversação prática

`/immersion.html` contém **32 cenários ramificados** e **16 histórias graduadas** A1–B2. Aceita texto, opção guiada ou voz local, trabalha objetivo comunicativo por turno e não avança quando a intenção não é reconhecida. Respostas, áudio e transcrições não são persistidos.

Detalhes: `docs/IMMERSION.md`.

## Bloco 10 — Planejador diário e gamificação madura

`/planner.html` coordena os módulos em uma rotina única. As metas padrão são **20 min/dia**, **120 min/semana**, **5 dias ativos/semana** e sessão preferida de **20 min**, todas configuráveis.

**Seu treino de hoje** considera dívida FSRS, designações próximas, índice de atenção, competências ausentes na semana e produção por fala, escrita e imersão. O plano é derivado novamente quando o estado muda, não salvo como snapshot.

`SIDES-XP-V2` preserva o XP bruto e calcula XP efetivo com retorno decrescente para repetições do mesmo item em ≤1 h / ≤6 h / ≤24 h / ≤72 h e teto de **500 XP efetivos/dia**, sem bloquear estudo ou domínio.

Detalhes: `docs/PLANNER.md`.

## Bloco 11 — Integridade, backup e recuperação

`/integrity.html` centraliza a proteção dos dados locais.

### Integridade

O SIDES executa `PRAGMA quick_check` e `PRAGMA foreign_key_check`. O sub-schema `SIDES-INTEGRITY-V1` registra somente estado mínimo de manutenção em `maintenance_state`.

### Backup SQLite automático e rotativo

O backup usa a API nativa de `node:sqlite`, grava primeiro um arquivo temporário e só o aceita depois de abrir a cópia, validar integridade/tabelas essenciais e calcular SHA-256.

Política padrão:

- **14** backups automáticos;
- **10** manuais;
- **5** pré-importação;
- **5** pré-restauração.

Ao iniciar, o SIDES tenta garantir um backup automático. Depois verifica a necessidade a cada 6 horas e só cria novo automático quando o último tem 24 horas ou mais. Os arquivos ficam em `data/backups/`.

### Exportação/importação completas

`SIDES-EXPORT-V9` inclui todas as tabelas da aplicação e um manifesto com a contagem de linhas. A importação rejeita tabelas desconhecidas, cria primeiro um backup `preimport` e substitui os dados dentro de uma única transação. `quick_check` e `foreign_key_check` precisam passar antes do `COMMIT`; falha implica `ROLLBACK`.

### Restauração segura

Um `.sqlite` enviado ou escolhido da lista é validado e preparado durante a sessão, mas **não substitui o banco que está aberto**. A troca ocorre no próximo início do SIDES, antes de abrir SQLite. O banco anterior e seus arquivos WAL/SHM são movidos para `data/recovery/` quando existirem, e o banco restaurado passa novamente pelas migrações normais até `SIDES-DB-V10`.

### Logs técnicos

Eventos de integridade, backup, importação e restauração ficam em `data/logs/` por até **30 dias**. O logger usa lista explícita de campos permitidos e não registra respostas de estudo, textos escritos, respostas de imersão, transcrições ou áudio.

Detalhes: `docs/INTEGRITY-BACKUP.md`.

## Trilha JW

`/jw.html` integra vocabulário, livros da Bíblia, leitura pública, comentários, discursos, designações, fala, escrita e cenários originais de congregação. O SIDES **não raspa, copia, armazena, redistribui nem incorpora automaticamente** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org.

Detalhes: `docs/JW-TRACK.md`.

## O que já funciona

- diagnóstico A1–B2;
- FSRS 5.4.1 e controle de dívida de revisão;
- currículo A1–B2 expandido;
- dashboard pedagógico e índice de atenção;
- Trilha JW e Minhas designações;
- fala offline com Whisper opcional;
- escrita inteligente com LanguageTool local opcional;
- imersão com 32 cenários e 16 histórias;
- metas diária/semanal e planejador coordenado;
- XP efetivo com proteção anti-farming;
- `quick_check` e verificação de chaves estrangeiras;
- backup SQLite automático/manual com validação e rotação;
- exportação JSON completa e importação transacional;
- restauração SQLite preparada e aplicada no reinício;
- logs técnicos locais com retenção;
- migração aditiva até `SIDES-DB-V10`;
- sub-schemas `SIDES-JW-ASSIGNMENTS-V1`, `SIDES-SPEECH-V1`, `SIDES-WRITING-V1`, `SIDES-IMMERSION-V1`, `SIDES-PLANNER-V1` e `SIDES-INTEGRITY-V1`;
- API local `SIDES-API-V9`;
- export `SIDES-EXPORT-V9`;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança, sem CDN ou analytics.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- backups em `data/backups/`, logs em `data/logs/` e contingência de restauração em `data/recovery/`;
- `data/`, binários, modelos e LanguageTool local não são versionados;
- sem conta, token, telemetria ou API paga;
- FSRS é local;
- Whisper, Piper e LanguageTool são locais e opcionais;
- áudio/transcrição não entram no banco;
- textos de escrita e respostas de imersão não entram no banco;
- planos diários são derivados, não armazenados;
- logs de manutenção não recebem conteúdo livre do usuário.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migração V2→V10, FSRS, currículo, Trilha JW, designações, fala, escrita, imersão, planejador, metas, XP efetivo, integridade SQLite, backup/rotação, exportação/importação, rollback, restauração no reinício, API e privacidade de schema/backup/logs.

Dados reais de estudo, gravações, textos produzidos, respostas de conversa, modelos, binários, bancos e backups nunca devem ser adicionados ao Git.
