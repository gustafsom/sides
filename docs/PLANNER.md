# Bloco 10 — Planejador diário e gamificação madura

## Objetivo

O Planejador transforma os módulos independentes do SIDES em uma rotina coordenada. Ele não substitui FSRS, Trilha JW, fala, escrita ou imersão; decide o que merece entrar primeiro na sessão de hoje.

## Metas configuráveis

Em `/planner.html`:

- minutos por dia: 10–120;
- minutos por semana: 30–840;
- dias ativos por semana: 2–7;
- duração preferida da sessão: 10–60 min.

Os padrões são 20 min/dia, 120 min/semana, 5 dias/semana e sessão de 20 min.

## Ordem de prioridade

A fila considera, em conjunto:

1. revisões FSRS vencidas, especialmente dívida >7 dias;
2. designações reais próximas e sua prontidão;
3. índice de atenção por habilidade;
4. competências ainda ausentes na semana;
5. imersão/conversação para produção integrada.

O plano é recalculado a partir do estado atual; não é salvo como uma lista rígida.

## Estimativa de tempo

O progresso usa os tempos já registrados por cada módulo:

- `reviews.response_ms` para atividades centrais;
- `writing_attempts.response_ms`;
- `speech_attempts.duration_ms`;
- `jw_assignment_practices.duration_ms`;
- duração-alvo de sessões de imersão concluídas.

Isso evita depender exclusivamente do campo histórico `activity.minutes`, que nas versões iniciais não contabilizava todas as atividades curtas.

## XP efetivo — SIDES-XP-V2

O SIDES mantém o XP bruto por compatibilidade e auditoria, mas a gamificação madura expõe também **XP efetivo**.

Repetir o mesmo item em intervalos muito curtos reduz apenas a recompensa:

- até 1 h: 10% do XP bruto;
- até 6 h: 25%;
- até 24 h: 50%;
- até 72 h: 75%;
- depois disso: 100%.

Há um teto de 500 XP efetivos/dia. O teto não bloqueia estudo, FSRS, registro de acerto, domínio ou correções; apenas impede recompensa ilimitada.

O histórico bruto não é reescrito. O XP efetivo é calculado deterministamente a partir de `reviews`, portanto pode ser auditado e reconstruído.

## Conquistas maduras

O planejador acompanha:

- meta diária;
- meta semanal de minutos;
- consistência semanal em dias;
- semana equilibrada por competências;
- dívida de revisões sob controle.

## Dados

`SIDES-DB-V9` adiciona somente `study_goals` e `plannerSchemaVersion=SIDES-PLANNER-V1`.

O backup inclui as metas. Planos diários não são persistidos, porque são derivados do estado atual e devem ser recalculados.

API:

- `GET /api/planner/today`
- `GET /api/planner/goals`
- `POST /api/planner/goals`
- `GET /api/rewards`

O Bloco 10 não adiciona serviço pago, telemetria ou dependência de nuvem.
