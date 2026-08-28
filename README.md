# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving e gamificação.

## Estado

MVP evolutivo `0.6.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas.

A versão 0.6.0 combina duas evoluções:

- expansão 5.1, que mais que dobra o volume curricular A1–B2;
- Bloco 6, com **Minhas designações**, planejamento de ensaios e acompanhamento de prontidão para situações reais da congregação.

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
- microfone apenas para gravação local de shadowing, leitura, discurso e ensaios.

## Currículo A1–B2 expandido

O pacote curricular agora reúne:

- **1.480** entradas curriculares no conjunto gerado de vocabulário/expressões;
- **640** frases/chunks;
- **320** exercícios de gramática;
- **200** itens de listening/ditado;
- **104** textos graduados de leitura.

Como o seed evita criar novamente uma linha textual idêntica já existente, o dashboard mede o banco real contra metas mínimas de:

- 1.200 itens de vocabulário;
- 600 chunks;
- 300 exercícios de gramática;
- 200 listenings;
- 100 leituras.

A expansão 5.1 adiciona sozinha **840** entradas lexicais/expressões, 320 chunks, 160 gramáticas, 100 listenings e 52 leituras novas. Isso cria margem para deduplicação de termos simples que já existiam.

A cobertura permanece equilibrada entre **A1, A2, B1 e B2** e inclui rotina, clima, roupas, tecnologia, orientação, restaurante/hotel, tarefas domésticas, transporte, conversação na congregação, carreira, cultura, bem-estar, colaboração, negociação, análise de risco, comunicação formal e pensamento crítico.

Cada item possui metadados de nível, tema, dificuldade e pré-requisitos. Pré-requisitos são um **sinal de prontidão**, não um bloqueio rígido.

## Minhas designações — Bloco 6

A rota local `/assignments.html` permite cadastrar e preparar:

- leitura da Bíblia;
- comentário de reunião;
- designação de estudante;
- discurso;
- apresentação de ministério;
- outra atividade de fala.

Para cada designação o SIDES registra apenas dados do usuário:

- título;
- referência curta, por exemplo `Jeremías 30:18-24`;
- data e horário;
- tempo-alvo;
- notas próprias;
- estado da preparação.

O plano é calculado automaticamente até a data. A frequência aumenta à medida que a designação se aproxima:

1. **fundamentos** — sessões espaçadas para vocabulário, estrutura e pontos difíceis;
2. **construção** — prática em blocos e correção das dificuldades;
3. **ensaio** — prática completa e cronometrada;
4. **revisão final** — baixa carga, confiança e estabilidade.

Cada ensaio pode registrar duração, confiança de 1 a 5, rubricas de leitura/fala, notas próprias, XP e evolução da prontidão. As rubricas com menor nota tornam-se **pontos explícitos de atenção** para os próximos ensaios. O áudio gravado no navegador permanece somente na memória da aba e não é persistido.

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
- mapa curricular expandido A1–B2;
- Trilha JW;
- Minhas designações com plano, ensaios e prontidão;
- backup JSON incluindo designações e histórico de ensaios;
- persistência SQLite local;
- migração aditiva do núcleo até `SIDES-DB-V5`;
- sub-schema `SIDES-JW-ASSIGNMENTS-V1` para designações;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança; sem CDN ou analytics.

## FSRS e pontos de atenção

Novas revisões usam `ts-fsrs@5.4.1`. Estados antigos são convertidos quando o item volta a ser revisado, sem zerar histórico.

O SIDES calcula prioridade considerando domínio estimado, erros ainda não recuperados, erros recentes, tendência, tempo desde a última prática e quantidade de evidências. Nas designações, esse mesmo princípio é aplicado às rubricas: as notas mais baixas são mostradas como pontos a priorizar no próximo ensaio.

## Trilha JW

A rota local `/jw.html` oferece a trilha especializada. A rota `/assignments.html` cuida das designações reais.

O SIDES **não raspa, copia, armazena, redistribui nem incorpora automaticamente** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org. Conteúdo oficial continua no JW.org/JW Library; o SIDES registra referências, dados do treino e progresso do usuário.

Detalhes: `docs/JW-TRACK.md`.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/` não é versionado;
- sem conta, token, telemetria ou API paga;
- `ts-fsrs` é executado localmente;
- gravações de treino não são enviadas nem salvas automaticamente;
- módulos futuros de voz/NLP continuam opt-in e locais.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migrações, FSRS, motor adaptativo, Trilha JW, currículo A1–B2, expansão 5.1, idempotência, planejamento de designações, ensaios, prontidão e segurança básica do servidor.

Dados reais de estudo, gravações e backups nunca devem ser adicionados ao Git.
