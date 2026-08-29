# Roadmap do CURESP

Os blocos têm entrega funcional independente. A linha de chegada definida é o **CURESP 1.0.0 no Bloco 13**; ideias adicionais que não sejam necessárias para a 1.0 entram no backlog pós-1.0. O nome SIDES, usado durante o desenvolvimento, permanece apenas em IDs técnicos legados quando necessário para compatibilidade.

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
- regras locais do CURESP e LanguageTool local opcional;
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
- metas configuráveis de minutos/dia, minutos/semana, dias ativos e duração da sessão;
- **Seu treino de hoje** calculado dinamicamente;
- prioridade por dívida FSRS, designações, índice de atenção e competências ausentes na semana;
- estimativa de tempo usando core, escrita, fala, designações e imersão;
- `SIDES-XP-V2` com XP efetivo e retorno decrescente por repetição;
- teto de 500 XP efetivos/dia sem bloquear estudo ou domínio;
- planos diários derivados, não persistidos;
- `study_goals` e `SIDES-PLANNER-V1`;
- migração aditiva para `SIDES-DB-V9`;
- API `SIDES-API-V8` e export `SIDES-EXPORT-V8`.

## Bloco 11 — Integridade, backup e recuperação ✅

- área **Integridade e backup** em `/integrity.html`;
- `PRAGMA quick_check` e `PRAGMA foreign_key_check`;
- `maintenance_state` e `SIDES-INTEGRITY-V1`;
- backup SQLite nativo com arquivo temporário, validação e SHA-256 antes da aceitação;
- backup automático ao iniciar quando necessário e verificação a cada 6 horas;
- novo automático somente quando o anterior tem 24 horas ou mais;
- rotação padrão: 14 automáticos, 10 manuais, 5 pré-importação e 5 pré-restauração;
- download de backups locais pela interface;
- exportação JSON completa `SIDES-EXPORT-V9` com manifesto por tabela;
- importação de backup JSON com validação prévia, backup `preimport`, transação única e rollback em falha de integridade;
- tabelas desconhecidas rejeitadas antes de modificar o banco;
- restauração SQLite validada e preparada durante a sessão;
- restauração aplicada apenas no próximo início, antes de abrir SQLite;
- banco anterior/WAL/SHM preservados em `data/recovery/` durante a troca;
- banco restaurado percorre novamente as migrações do CURESP;
- logs técnicos JSONL locais, sem conteúdo livre do usuário, com retenção padrão de 30 dias;
- migração aditiva para `SIDES-DB-V10`;
- API local `SIDES-API-V9`.

## Bloco 12 — Produto Windows instalável ✅

- produto então desenvolvido sob a identidade SIDES `0.12.0`, promovido a CURESP antes da primeira release;
- `node.exe` portátil incluído no pacote e `ts-fsrs@5.4.1` embarcado;
- instalação 1.0 padrão em `%LOCALAPPDATA%\CURESP`;
- código versionado em `versions\<versão>` e dados persistentes fora das versões;
- `SIDES_DATA_DIR` preservado como ID técnico para compatibilidade com `data/sides.sqlite`;
- inicialização por `wscript.exe`, sem janela de terminal;
- validação de que a porta local pertence ao processo esperado antes de reutilizá-la;
- atalhos no Desktop e Menu Iniciar;
- configuradores de Whisper e LanguageTool mantidos em caminho estável entre versões;
- protocolo interno `SIDES-WINDOWS-PACKAGE-V1` com SHA-256 por arquivo e checksum do manifesto;
- ZIP acompanhado de SHA-256 externo;
- atualização opt-in por pacote local, sem download automático de código;
- atualização rejeita checksum inválido, pacote incompatível e versão não superior;
- atualização troca apenas a versão da aplicação e nunca substitui a pasta de dados;
- desinstalação preserva dados por padrão e exige confirmação adicional para removê-los;
- CI dedicado em `windows-latest` valida parser PowerShell, constrói o ZIP, verifica o pacote e inicia o servidor usando o Node portátil;
- pacote do `main` publicado como artifact temporário do GitHub Actions;
- funcionamento básico após instalação sem Node/npm/Git/GitHub na máquina;
- DB/API permanecem compatíveis em `SIDES-DB-V10` / `SIDES-API-V9`.

## Bloco 13 — Qualidade, segurança, SISDEV e Release 1.0 ✅

- versão promovida para **CURESP 1.0.0** antes da primeira release formal;
- testes E2E HTTP de aceitação com headers defensivos e caminhos fail-closed;
- migração legada V2 → V10 mantida no gate integral;
- `scripts/security-audit.mjs` com allowlist de dependências, busca de secrets e invariantes local-first;
- `npm audit --omit=dev --audit-level=high` no CI de release;
- auditoria técnica de licenças e `THIRD_PARTY_NOTICES.md`;
- build Windows falha se não puder incluir a licença integral da distribuição Node;
- rollback operacional de aplicação usando `current`/`previous` sem alterar `dataDir`;
- CI Windows instala o pacote real em diretório temporário e executa o runtime instalado;
- `CURESP-GATE.ps1` fail-closed, preso a SHA exato, working tree limpa e modo `READ_ONLY`;
- resultado SISDEV sanitizado em `%USERPROFILE%\Downloads\SISDEV\RESULTADOS\curesp`;
- changelog, roteiro de aceitação e documentação de release/rollback;
- constatação registrada de que `main` está sem branch protection/ruleset em 2026-08-28;
- processo de release exige PR, CI verde e `expected_head_sha` enquanto essa governança não for habilitada;
- tag final `v1.0.0` reservada ao SHA que também passar o gate CURESP/SISDEV local;
- backlog pós-1.0 separado do escopo dos 13 blocos.
