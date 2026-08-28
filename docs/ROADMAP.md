# Roadmap do SIDES

Os blocos têm entrega funcional independente. A linha de chegada definida é o **SIDES 1.0.0 no Bloco 13**; ideias adicionais que não sejam necessárias para a 1.0 entram no backlog pós-1.0.

## Bloco 1 — Fundação local ✅

- servidor loopback e SQLite;
- diagnóstico A1–B2;
- vocabulário, gramática, escuta, leitura e shadowing;
- XP, níveis, sequência, missão diária e conquistas;
- backup JSON e testes automatizados.

## Bloco 2 — Motor adaptativo V2 ✅

- domínio por habilidade/tópico;
- fila ajustada a erros, domínio e nível;
- caderno automático de erros;
- variante de espanhol configurável.

## Bloco 3 — Trilha JW ✅

- vocabulário congregacional/bíblico;
- 66 livros e abreviações da Bíblia;
- leitura pública, comentários e discursos;
- rubricas de autoavaliação;
- links oficiais sem incorporar conteúdo protegido.

## Bloco 4 — Motor de aprendizagem definitivo ✅

- FSRS estável e migração progressiva do SRS antigo;
- frases/chunks;
- contraste português ↔ espanhol e falsos cognatos;
- histórico granular por habilidade;
- índice de atenção pedagógica;
- explicações e ações recomendadas;
- dashboard de evolução;
- controle de dívida de revisão.

## Bloco 5 — Currículo A1–B2 completo ✅

- currículo original A1–B2;
- metadados de dificuldade, tema e pré-requisitos;
- sinal de prontidão sem bloqueio rígido;
- mapa curricular;
- seed idempotente;
- migração aditiva até `SIDES-DB-V4`.

### Expansão 5.1 — conteúdo mais que dobrado ✅

- 1.480 entradas lexicais/expressões;
- 640 frases/chunks;
- 320 exercícios de gramática;
- 200 itens de listening;
- 104 textos graduados;
- metas reais do banco: 1.200 / 600 / 300 / 200 / 100;
- margem para deduplicação lexical.

## Bloco 6 — Trilha JW avançada e designações reais ✅

- **Minhas designações**;
- leitura, comentário, estudante, discurso, ministério e outro;
- referência curta, data/horário, tempo-alvo e notas próprias;
- plano fundamentos → construção → ensaio → revisão final;
- histórico, confiança, rubricas e prontidão 0–100;
- próxima designação visível no painel;
- migração aditiva para `SIDES-DB-V5`;
- nenhum texto oficial importado automaticamente.

## Bloco 7 — Escuta e fala offline ✅

- `whisper.cpp` local e opcional;
- instalador separado com checksum;
- WAV PCM16 mono 16 kHz no navegador;
- omissões, substituições, adições, ritmo e pausas;
- histórico de métricas e domínio adaptativo;
- áudio/transcrição/texto-alvo não persistidos;
- Piper opcional + SpeechSynthesis fallback;
- migração aditiva para `SIDES-DB-V6`.

## Bloco 8 — Gramática e escrita inteligente ✅

- `/writing.html`;
- 32 propostas A1–B2 + texto livre;
- regras SIDES e LanguageTool local opcional;
- endpoint remoto bloqueado;
- classificação pedagógica de padrões;
- reescrita e recuperação de dificuldades;
- texto produzido/corrigido não persistido;
- migração aditiva para `SIDES-DB-V7`.

## Bloco 9 — Imersão e conversação prática ✅

- `/immersion.html`;
- 32 cenários ramificados e 16 histórias graduadas;
- texto, opção guiada ou voz via Whisper local;
- objetivo comunicativo e reparo explícito;
- sessão de aproximadamente 18 minutos;
- meta de ≥85% da produção em espanhol;
- seleção adaptativa e proteção inicial contra repetição por XP;
- respostas/transcrições/áudio não persistidos;
- migração aditiva para `SIDES-DB-V8`.

## Bloco 10 — Planejador diário e gamificação madura ✅

- área **Planejador diário** em `/planner.html`;
- metas configuráveis de minutos por dia, minutos por semana, dias ativos e duração preferida da sessão;
- padrão 20 min/dia, 120 min/semana, 5 dias/semana e sessão de 20 min;
- **Seu treino de hoje** calculado dinamicamente;
- prioridade combinada por dívida FSRS, designações próximas, índice de atenção e competências ausentes na semana;
- dívida de revisão >7 dias e designação para o dia seguinte podem atingir prioridade máxima;
- estimativa de tempo usando os registros próprios de core, escrita, fala, designações e imersão;
- resumo do plano no dashboard principal;
- acesso direto do item recomendado ao módulo correspondente;
- `SIDES-XP-V2`: XP bruto preservado e XP efetivo calculado para gamificação madura;
- retorno decrescente ao repetir o mesmo item em ≤1 h / ≤6 h / ≤24 h / ≤72 h;
- teto de 500 XP efetivos/dia sem bloquear estudo ou domínio;
- conquistas por meta diária, tempo semanal, dias ativos, equilíbrio de competências e revisões sob controle;
- planos diários não são persistidos: são derivados do estado atual;
- nova tabela `study_goals` e `plannerSchemaVersion=SIDES-PLANNER-V1`;
- migração aditiva para `SIDES-DB-V9`;
- API `SIDES-API-V8` e export `SIDES-EXPORT-V8`.

## Bloco 11 — Integridade, backup e recuperação

- backup automático rotativo;
- restauração validada;
- migrações e recuperação de banco;
- exportação/importação completa;
- logs locais com retenção controlada.

## Bloco 12 — Produto Windows instalável

- instalação e atalhos;
- execução sem terminal;
- atualização opt-in segura;
- verificação de pacote/checksum;
- funcionamento local mesmo sem GitHub disponível.

## Bloco 13 — Qualidade, segurança, SISDEV e Release 1.0

- testes E2E e de migração;
- auditoria de segurança/licenças;
- gate local do SISDEV e fechamento do registro no Control Plane;
- release, changelog, tags e rollback;
- roteiro completo de aceitação.
