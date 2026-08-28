# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving, fala, escrita e gamificação.

## Estado

MVP evolutivo `0.8.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas obrigatórias.

A versão 0.8.0 preserva currículo A1–B2 expandido, designações e fala offline e adiciona o **Bloco 8 — gramática e escrita inteligente**, com produção livre/guiada, reescrita adaptativa, corretor SIDES sempre disponível e LanguageTool local opcional.

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

Whisper e LanguageTool não são necessários para abrir o SIDES. Sem eles, fala continua com comparação manual e escrita continua com as regras locais do SIDES.

## Requisitos

- Node.js 22.13+ (ambiente-alvo Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para treinos de fala;
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

A rota `/writing.html` implementa um ciclo de produção deliberada:

1. escolher tema adaptativo ou texto livre;
2. escrever em espanhol;
3. analisar sem salvar ou registrar a tentativa;
4. revisar alertas e explicações;
5. reescrever;
6. recuperar os padrões que deixaram de aparecer.

O banco inicial possui **32 propostas originais**, 8 por nível A1/A2/B1/B2. Os contextos cobrem rotina, mensagens, viagem, trabalho, opinião, congregação e preparação de fala/discurso.

A revisão combina:

- regras locais SIDES, sempre disponíveis;
- LanguageTool local opcional;
- classificação pedagógica em padrões como concordância, verbos, preposições, pronomes, ser/estar, por/para, ortografia, acentuação, pontuação, registro e estilo;
- explicação e uma ação concreta para cada tipo de dificuldade;
- integração com `skill_mastery`, `skill_events`, caderno de erros e índice de atenção.

Antes do diagnóstico, o treino de escrita permanece em A1.

### Reescrita e recuperação

Ao registrar uma reescrita, ela pode ser vinculada à tentativa anterior. Se uma categoria que estava presente deixa de aparecer, o SIDES registra a recuperação daquele padrão e atualiza o domínio adaptativo. Assim o sistema não recompensa apenas “ver correções”; ele mede a capacidade de produzir uma nova versão melhor.

### LanguageTool local

O configurador opcional:

```powershell
.\CONFIGURAR-GRAMATICA-LOCAL.ps1
```

prepara LanguageTool 6.6 com checksum verificado. Java 17+ é necessário somente para esse componente.

O backend aceita LanguageTool **somente em endereço de loopback**. URLs públicas/remotas são bloqueadas antes de qualquer chamada. O SIDES não envia textos para `api.languagetool.org`.

### Privacidade da escrita

`writing_attempts` e `writing_issue_summary` armazenam somente métricas, categorias e vínculo de revisão. Não são persistidos:

- texto escrito;
- texto original;
- texto corrigido;
- conteúdo de sugestões completas.

**Analisar sem salvar** não cria uma tentativa no banco. **Registrar tentativa** mantém apenas as métricas necessárias para evolução pedagógica. O backup segue a mesma fronteira.

O “índice de revisão” não é uma nota CEFR nem garantia de correção: LanguageTool e regras heurísticas podem gerar falso positivo ou deixar erros passar.

Detalhes: `docs/WRITING.md` e `docs/FREE-TOOLS.md`.

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
- escrita inteligente com 32 propostas A1–B2 e texto livre;
- LanguageTool local opcional com bloqueio de endpoints remotos;
- reescrita adaptativa e recuperação de padrões;
- backup JSON;
- persistência SQLite local;
- migração aditiva até `SIDES-DB-V7`;
- sub-schema `SIDES-JW-ASSIGNMENTS-V1`;
- sub-schema `SIDES-SPEECH-V1`;
- sub-schema `SIDES-WRITING-V1`;
- API local `SIDES-API-V6`;
- export `SIDES-EXPORT-V6`;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança, sem CDN ou analytics.

## Trilha JW

A rota `/jw.html` oferece a trilha especializada e integra links para designações, fala e escrita.

O SIDES **não raspa, copia, armazena, redistribui nem incorpora automaticamente** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org. Prompts da trilha de escrita relacionados à congregação exigem formulação com palavras próprias; texto produzido pelo usuário também não entra no histórico do banco.

Detalhes: `docs/JW-TRACK.md`.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/`, binários, modelos e LanguageTool local não são versionados;
- sem conta, token, telemetria ou API paga;
- FSRS é local;
- Whisper é local e opcional;
- Piper é local e opcional;
- LanguageTool é local e opcional;
- áudio/transcrição não entram no banco;
- texto de escrita não entra no banco;
- o caminho funcional básico permanece disponível sem componentes pesados.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migração V2→V7, FSRS, motor adaptativo, currículo A1–B2, Trilha JW, designações, fala, escrita, bloqueio de correção remota, reescrita/recuperação e privacidade do schema/backup.

Dados reais de estudo, gravações, textos produzidos, modelos, binários e backups nunca devem ser adicionados ao Git.
