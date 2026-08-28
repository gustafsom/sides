# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving, fala, escrita, imersão e planejamento adaptativo.

## Estado

MVP evolutivo `0.10.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas obrigatórias.

A versão 0.10.0 preserva os Blocos 1–9 e adiciona o **Bloco 10 — Planejador diário e gamificação madura**: metas de estudo, “Seu treino de hoje”, coordenação entre todos os módulos e XP efetivo resistente a farming.

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

Whisper e LanguageTool não são necessários para abrir o SIDES. Sem eles, fala continua com comparação manual, escrita mantém as regras locais do SIDES e Imersão funciona por texto.

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

`/speech.html` oferece shadowing, leitura, gravação local e comparação textual. `whisper.cpp` é opcional. O SIDES trata os resultados como indicadores de inteligibilidade/correspondência, não como medição científica de sotaque. Áudio, transcrição e texto-alvo não são persistidos.

Detalhes: `docs/OFFLINE-SPEECH.md`.

## Bloco 8 — Gramática e escrita inteligente

`/writing.html` oferece produção guiada/livre e reescrita deliberada. Regras SIDES funcionam sempre; LanguageTool local é opcional e endpoints remotos são bloqueados. O banco guarda métricas e categorias, nunca o texto produzido/corrigido.

Detalhes: `docs/WRITING.md`.

## Bloco 9 — Imersão e conversação prática

`/immersion.html` contém **32 cenários ramificados** e **16 histórias graduadas** A1–B2. Aceita texto, opção guiada ou voz local, trabalha objetivo comunicativo por turno e não avança quando a intenção não é reconhecida. A sessão combinada dura aproximadamente 18 minutos e busca ≥85% da produção em espanhol. Respostas, áudio e transcrições não são persistidos.

Detalhes: `docs/IMMERSION.md`.

## Bloco 10 — Planejador diário e gamificação madura

`/planner.html` coordena o que já existe no SIDES em uma rotina única.

Metas padrão:

- **20 min/dia**;
- **120 min/semana**;
- **5 dias ativos/semana**;
- sessão preferida de **20 min**.

Essas metas são configuráveis. O plano **Seu treino de hoje** é recalculado a partir do estado atual, considerando:

1. dívida de revisões FSRS, com prioridade maior para atrasos >7 dias;
2. designações próximas e prontidão;
3. índice de atenção por habilidade;
4. competências ainda ausentes na semana;
5. produção integrada por fala, escrita e imersão.

O dashboard principal exibe as prioridades mais importantes e cada item abre diretamente o módulo indicado. O plano diário não é salvo como snapshot: é derivado novamente quando o estado muda.

### Tempo de estudo

O planejador combina tempos registrados por cada módulo — `reviews.response_ms`, escrita, fala, ensaios de designação e imersão — em vez de depender apenas do contador histórico de minutos.

### XP efetivo — `SIDES-XP-V2`

O XP bruto histórico continua intacto. Para nível/metas de gamificação madura, o SIDES calcula **XP efetivo** com retorno decrescente ao repetir o mesmo item:

- até 1 h: 10%;
- até 6 h: 25%;
- até 24 h: 50%;
- até 72 h: 75%;
- depois disso: 100%.

Há teto de **500 XP efetivos/dia**. O teto nunca bloqueia estudo, FSRS, acertos, domínio ou correções; reduz somente a recompensa de gamificação.

Conquistas maduras acompanham meta diária, tempo semanal, dias ativos, equilíbrio de competências e dívida de revisões sob controle.

Detalhes: `docs/PLANNER.md`.

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
- conquistas de consistência e equilíbrio;
- backup JSON e SQLite local;
- migração aditiva até `SIDES-DB-V9`;
- sub-schemas `SIDES-JW-ASSIGNMENTS-V1`, `SIDES-SPEECH-V1`, `SIDES-WRITING-V1`, `SIDES-IMMERSION-V1` e `SIDES-PLANNER-V1`;
- API local `SIDES-API-V8`;
- export `SIDES-EXPORT-V8`;
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
- planos diários são derivados, não armazenados;
- o caminho funcional básico permanece disponível sem componentes pesados.

## Validação

```text
npm run check
```

O gate cobre sintaxe, migração V2→V9, FSRS, currículo, Trilha JW, designações, fala, escrita, imersão, planejador, metas, prioridades, cálculo de tempo, XP efetivo, teto anti-farming, API e privacidade do schema/backup.

Dados reais de estudo, gravações, textos produzidos, respostas de conversa, modelos, binários e backups nunca devem ser adicionados ao Git.
