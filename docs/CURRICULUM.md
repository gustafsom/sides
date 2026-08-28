# Currículo A1–B2 — Bloco 5 + expansão 5.1

## Objetivo

Sustentar estudo diário prolongado com volume amplo de conteúdo, mantendo adaptação, explicações, FSRS e progressão por nível.

## Pacote

`SIDES-CURRICULUM-B5-V2`

### Conjunto curricular gerado

| Tipo | Quantidade no conjunto |
|---|---:|
| Vocabulário/expressões | 1.480 |
| Frases/chunks | 640 |
| Gramática | 320 |
| Listening/ditado | 200 |
| Leitura graduada | 104 |

A expansão 5.1 acrescenta ao pacote anterior:

| Tipo | Conteúdo novo |
|---|---:|
| Vocabulário/expressões | 840 |
| Frases/chunks | 320 |
| Gramática | 160 |
| Listening/ditado | 100 |
| Leitura graduada | 52 |

As 200 expressões lexicais adicionais dão margem para deduplicação de termos simples já presentes no banco. O dashboard considera o banco real e exige pelo menos 1.200 / 600 / 300 / 200 / 100 itens por família para considerar as metas dobradas atendidas.

## Níveis

- **A1 — Fundamentos:** necessidades imediatas, rotina, clima, roupas, tecnologia, orientação e conversas simples.
- **A2 — Autonomia básica:** viagem, serviços, saúde, tarefas domésticas, transporte, trabalho e conversação na congregação.
- **B1 — Independência:** opinião, carreira, cultura, bem-estar, colaboração, feedback e explicação de ideias.
- **B2 — Precisão e nuance:** argumentação, negociação, liderança, análise de risco, comunicação formal e pensamento crítico.

## Metadados

Cada item recebe `level`, `topic`, `difficulty`, `prerequisites`, `pack` e uma chave curricular estável. Os metadados ficam em `curriculum_meta`, separados das tabelas históricas.

## Pré-requisitos

Pré-requisitos são um **sinal de prontidão**, não uma trava. O domínio em `skill_mastery` influencia a ordenação, enquanto ausência de histórico mantém uma prontidão neutra e conservadora.

## Migração e idempotência

O banco global passa para `SIDES-DB-V5`; o currículo mantém seu próprio `curriculumSchemaVersion` e o pacote `SIDES-CURRICULUM-B5-V2`.

Ao trocar o pacote V1 pelo V2:

1. o SIDES detecta a nova versão de `curriculumPackVersion`;
2. executa seed transacional;
3. reutiliza itens textualmente idênticos já existentes;
4. insere apenas conteúdo novo;
5. atualiza metadados para o pacote V2;
6. mantém estados FSRS e histórico;
7. uma nova inicialização não duplica os itens;
8. o seed curricular não altera nem rebaixa a versão global do banco.

## Dashboard

O mapa curricular apresenta metas mínimas, total real disponível, cobertura por nível, temas e conclusão do pacote.

## Segurança e direitos autorais

Todo o conteúdo curricular é produzido especificamente para o SIDES. A Trilha JW continua separada e não copia nem armazena automaticamente textos protegidos do JW.org/JW Library.
