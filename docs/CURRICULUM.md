# Currículo A1–B2 — Bloco 5

## Objetivo

Transformar o SIDES de um MVP com conteúdo-semente em um sistema capaz de sustentar estudo diário prolongado, mantendo adaptação, explicações e revisão espaçada.

## Pacote

`SIDES-CURRICULUM-B5-V1`

Conteúdo adicionado:

| Tipo | Quantidade |
|---|---:|
| Vocabulário curricular | 640 |
| Frases/chunks | 320 |
| Gramática | 160 |
| Listening/ditado | 100 |
| Leitura graduada | 52 |

O conteúdo existente dos blocos anteriores continua preservado e é somado a esse pacote.

## Níveis

- **A1 — Fundamentos:** necessidades imediatas, rotina, cidade, compras, alimentação, reunião e leitura simples.
- **A2 — Autonomia básica:** viagem, serviços, saúde, trabalho, estudo, relações e experiências.
- **B1 — Independência:** opinião, comunicação, mídia, sociedade, ambiente, projetos e explicação de ideias.
- **B2 — Precisão e nuance:** argumentação, valores, negociação, liderança, aprendizagem e discurso estruturado.

## Metadados

Cada item do pacote recebe:

- `level`;
- `topic`;
- `difficulty`;
- `prerequisites`;
- `pack`;
- uma chave curricular estável.

Os metadados ficam em `curriculum_meta`, separados das tabelas históricas. Isso permite ampliar o currículo sem reescrever ou apagar progresso.

## Pré-requisitos

Pré-requisitos são um **sinal de prontidão**, não uma trava.

Quando um item avançado depende de uma habilidade anterior, o SIDES consulta `skill_mastery`. Domínio mais alto aumenta a prioridade. Quando ainda não há histórico, usa-se uma prontidão neutra conservadora, permitindo que o usuário continue estudando.

## Migração

O banco passa para `SIDES-DB-V4`.

A migração:

1. mantém tabelas e dados anteriores;
2. cria `curriculum_meta`;
3. insere apenas conteúdo inexistente;
4. usa chaves estáveis para tornar o seed idempotente;
5. mantém os estados FSRS antigos intactos;
6. não modifica gravações, backups ou dados pessoais.

## Dashboard

A tela principal mostra um mapa curricular com:

- metas mínimas;
- total disponível;
- cobertura por nível;
- distribuição por temas;
- status de conclusão do pacote.

## Segurança e direitos autorais

O conteúdo do Bloco 5 é escrito especificamente para o SIDES.

A Trilha JW continua separada: o SIDES pode treinar vocabulário, habilidades e preparação, mas não copia nem armazena textos protegidos do JW.org/JW Library.