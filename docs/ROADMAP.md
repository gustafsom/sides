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

- conjunto gerado passa a 1.480 entradas lexicais/expressões;
- 640 frases/chunks;
- 320 exercícios de gramática;
- 200 itens de listening;
- 104 textos graduados;
- metas reais do banco: 1.200 / 600 / 300 / 200 / 100;
- novos temas em todos os níveis A1–B2;
- margem para deduplicação lexical.

## Bloco 6 — Trilha JW avançada e designações reais ✅

- área **Minhas designações**;
- leitura, comentário, estudante, discurso, ministério e outro;
- referência curta, data/horário, tempo-alvo e notas próprias;
- plano automático do dia atual até a data;
- frequência crescente conforme a designação se aproxima;
- fases fundamentos → construção → ensaio → revisão final;
- cronômetro e gravação temporária no navegador;
- histórico de ensaios;
- confiança e rubricas;
- prontidão 0–100;
- rubricas mais fracas transformadas em foco do próximo ensaio;
- próxima designação visível no painel principal;
- designações incluídas no backup JSON;
- migração aditiva para `SIDES-DB-V5`;
- nenhum texto oficial importado ou copiado automaticamente.

## Bloco 7 — Escuta e fala offline ✅

- `whisper.cpp` local e opcional, com falha segura quando ausente;
- instalador Windows separado, com build/modelo verificados por checksum;
- conversão do áudio no navegador para WAV PCM16 mono 16 kHz, sem FFmpeg;
- reconhecimento em espanhol e processamento somente local;
- alinhamento palavra a palavra entre texto-alvo e hipótese reconhecida;
- omissões, substituições, adições e diferenças de acentuação/grafia;
- ritmo, pausas longas e silêncio como indicadores de fluência;
- recomendações específicas para o próximo treino;
- shadowing e leitura com alvos do currículo A1–B2;
- texto próprio temporário para leituras/designações;
- histórico de métricas e domínio adaptativo de fala;
- áudio, transcrição e texto-alvo não são persistidos;
- Piper opcional e SpeechSynthesis do navegador/SO como fallback;
- migração aditiva para `SIDES-DB-V6`.

## Bloco 8 — Gramática e escrita inteligente

- LanguageTool local opcional;
- produção escrita livre;
- classificação de erros;
- repetição direcionada aos padrões encontrados.

## Bloco 9 — Imersão e conversação prática

- cenários cotidianos, viagem e congregação;
- diálogos ramificados;
- histórias graduadas;
- sessões predominantemente em espanhol.

## Bloco 10 — Planejador diário e gamificação madura

- objetivo diário/semanal;
- sessão montada automaticamente;
- prioridade por revisões, fraquezas e designações próximas;
- métricas por competência e proteção contra XP fácil/infinito.

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
