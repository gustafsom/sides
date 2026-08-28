# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, fala, escrita, imersão, planejamento adaptativo e proteção local do progresso.

## Estado

MVP evolutivo `0.12.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas obrigatórias.

A versão 0.12.0 preserva os Blocos 1–11 e adiciona o **Bloco 12 — Produto Windows instalável**: pacote x64 com Node portátil, instalação versionada, execução sem terminal, atualização local opt-in com checksum e dados persistentes separados do código.

## Usar a partir do código-fonte

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

## Produto Windows instalável

O build Windows cria:

```text
SIDES-0.12.0-windows-x64.zip
SIDES-0.12.0-windows-x64.zip.sha256
```

O pacote contém `node.exe`, `ts-fsrs@5.4.1`, a aplicação, instalador e launcher. Depois da instalação, a máquina não precisa ter Node, npm, Git ou acesso ao GitHub para executar o SIDES.

Para construir em Windows:

```powershell
.\BUILD-WINDOWS-PACKAGE.ps1
```

Depois de extrair o ZIP, execute `INSTALAR-SIDES.vbs`. A instalação padrão fica em:

```text
%LOCALAPPDATA%\SIDES\
  data\
  versions\0.12.0\
  SIDES.vbs
  install-state.json
```

A pasta `data` é persistente e não pertence a nenhuma versão. O banco respeita `SIDES_DATA_DIR`; sem essa variável, o modo fonte continua usando `data/sides.sqlite`.

O Menu Iniciar recebe atalhos para SIDES, atualização, configuração opcional de voz/gramática e desinstalação. A inicialização principal usa `wscript.exe` e não abre janela de terminal.

A atualização é **opt-in**: o usuário escolhe um ZIP local. O SIDES exige o SHA-256 externo do ZIP, valida o manifesto interno e cada arquivo, rejeita versão não superior e instala a nova aplicação em outra pasta de `versions/`. O banco não é substituído.

Detalhes: `docs/WINDOWS-PRODUCT.md`.

## Requisitos do código-fonte

- Node.js 22.13+ (ambiente-alvo Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para fala/conversação oral;
- `whisper.cpp` opcional para transcrição local;
- Java 17+ apenas para LanguageTool local.

O pacote Windows principal já leva o runtime Node necessário.

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

O SIDES executa `PRAGMA quick_check` e `PRAGMA foreign_key_check`. O backup usa a API nativa de `node:sqlite`, grava primeiro um arquivo temporário e só aceita a cópia depois de validar integridade/tabelas essenciais e calcular SHA-256.

Política padrão: **14** backups automáticos, **10** manuais, **5** pré-importação e **5** pré-restauração. O backup automático é verificado na inicialização e depois a cada 6 horas, criando novo arquivo quando o anterior tem 24 horas ou mais.

`SIDES-EXPORT-V9` inclui todas as tabelas da aplicação. A importação cria backup prévio, usa uma única transação e só confirma depois dos checks de integridade. A restauração de SQLite é preparada durante a sessão e aplicada no próximo início.

Logs técnicos ficam em `data/logs/` por até 30 dias e não recebem conteúdo livre do usuário.

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
- integridade SQLite, backup rotativo, importação e restauração;
- logs técnicos locais com retenção;
- produto Windows x64 com Node portátil;
- instalação versionada e dados separados;
- execução sem terminal por atalho;
- atualização opt-in por pacote local verificado;
- desinstalação que preserva dados por padrão;
- migração aditiva até `SIDES-DB-V10`;
- sub-schemas `SIDES-JW-ASSIGNMENTS-V1`, `SIDES-SPEECH-V1`, `SIDES-WRITING-V1`, `SIDES-IMMERSION-V1`, `SIDES-PLANNER-V1` e `SIDES-INTEGRITY-V1`;
- pacote `SIDES-WINDOWS-PACKAGE-V1`;
- API local `SIDES-API-V9`;
- export `SIDES-EXPORT-V9`;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança, sem CDN ou analytics.

## Privacidade e custos

- progresso no SQLite local;
- no modo instalado, dados ficam separados das versões da aplicação;
- backups, logs e recuperação permanecem junto à pasta persistente de dados;
- `data/`, `dist/`, binários opcionais, modelos e LanguageTool local não são versionados;
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

O gate Linux cobre sintaxe, migração V2→V10, FSRS, currículo, Trilha JW, designações, fala, escrita, imersão, planejador, XP, integridade/backup e o manifesto Windows.

O gate `windows-latest` analisa os scripts PowerShell, constrói o ZIP real, verifica SHA-256/manifests e inicia o servidor usando o `node.exe` carregado dentro do próprio pacote. Em `main`, o pacote e seu checksum são publicados como artifact temporário do GitHub Actions.

Dados reais de estudo, gravações, textos produzidos, respostas de conversa, modelos, binários, bancos, backups e pacotes `dist/` nunca devem ser adicionados ao Git.
