# Imersão e conversação prática — Bloco 9

## Objetivo

A Imersão transforma o conteúdo estudado no SIDES em recuperação e produção contextual. O motor é determinístico e local: não depende de IA generativa, conta externa ou API paga.

A rota é `/immersion.html`.

## Conteúdo inicial

- 32 cenários ramificados originais: 8 A1, 8 A2, 8 B1 e 8 B2;
- 16 histórias graduadas originais: 4 por nível;
- temas de cotidiano, viagem, alimentação, compras, trabalho, saúde, opinião/mídia e congregação.

O conteúdo de congregação é original do SIDES e treina competências linguísticas. Não contém texto copiado de publicações, artigos ou Bíblia do JW.org.

## Diálogos ramificados

Cada nó possui:

- fala do interlocutor;
- objetivo comunicativo;
- uma ou mais intenções aceitáveis;
- palavras/expressões que ajudam a reconhecer a intenção;
- próximo nó;
- resposta do interlocutor;
- modelos opcionais de apoio.

O usuário pode escrever uma resposta livre. O motor tenta identificar a intenção. Quando não consegue, a conversa permanece no mesmo nó e oferece reparo. Isso evita uma falsa impressão de compreensão.

Alternativas guiadas existem para reduzir a dificuldade quando necessário, mas não são obrigatórias.

## Voz

Quando `whisper.cpp` estiver configurado pelo Bloco 7:

1. o navegador grava o áudio;
2. converte localmente para WAV PCM16 mono 16 kHz;
3. envia ao servidor loopback;
4. Whisper produz uma hipótese de transcrição em espanhol;
5. a hipótese é usada somente no turno atual;
6. áudio e transcrição são descartados.

Sem Whisper, toda a Imersão continua disponível por texto.

## Revisão linguística

A resposta livre pode passar transitoriamente pelo motor do Bloco 8. As categorias de revisão aparecem no feedback do turno, mas o texto não é salvo em `writing_attempts` nem em qualquer tabela de Imersão.

LanguageTool, quando utilizado, continua restrito a endereço de loopback.

## Histórias graduadas

As histórias são lidas integralmente em espanhol e seguidas por perguntas de compreensão. O objetivo é recuperar a informação com palavras próprias em vez de traduzir cada frase.

## Plano imersivo

`GET /api/immersion/plan` monta um plano com:

- 1 diálogo, alvo aproximado de 10 minutos;
- 1 história, alvo aproximado de 8 minutos;
- meta de pelo menos 85% da produção em espanhol.

A seleção prioriza o nível atual, conteúdo não praticado recentemente e habilidades fracas que correspondem aos objetivos do cenário.

Antes do diagnóstico, somente A1 é liberado.

## Métricas

`immersion_sessions` registra estado e métricas agregadas da sessão. `immersion_turn_metrics` registra métricas por turno.

São persistidos, entre outros:

- identificador do conteúdo;
- nível e tema;
- etapa atual;
- modo de entrada;
- número de turnos;
- turnos comunicativamente bem-sucedidos;
- quantidade de palavras produzidas;
- número de alertas da revisão linguística;
- índice agregado de revisão;
- score e XP.

Não são persistidos:

- resposta escrita;
- transcrição;
- áudio;
- gravação/blob;
- conteúdo produzido pelo usuário.

O backup JSON contém as mesmas métricas, não as respostas.

## Score e XP

O score considera principalmente o percentual de turnos em que o objetivo comunicativo foi atingido, com penalidade limitada por densidade de alertas linguísticos.

XP é concedido somente na conclusão da sessão. Repetir o mesmo conteúdo dentro de sete dias reduz fortemente o XP, diminuindo incentivo a repetir uma atividade já conhecida apenas pela recompensa.

A política geral contra XP fácil/infinito será ampliada no Bloco 10.

## API

- `GET /api/immersion/overview`
- `GET /api/immersion/plan`
- `POST /api/immersion/start`
- `GET /api/immersion/:id`
- `POST /api/immersion/:id/respond`
- `POST /api/immersion/:id/abandon`

Schema global: `SIDES-DB-V8`.

Sub-schema: `SIDES-IMMERSION-V1`.

API: `SIDES-API-V7`.

Export: `SIDES-EXPORT-V7`.
