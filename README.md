# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback imediato, interleaving e gamificação.

## Estado

MVP `0.3.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas.

## Iniciar

Windows / PowerShell:

```powershell
.\INICIAR-SIDES.ps1
```

ou:

```text
npm start
```

Abra `http://127.0.0.1:4317`.

## Requisitos

- Node.js 22.13+ (o ambiente-alvo usa Node 24);
- navegador moderno;
- microfone apenas para gravação de shadowing/leitura/discurso.

Não há dependências npm obrigatórias no MVP.

## O que já funciona

- diagnóstico inicial A1–B2;
- painel com XP, nível, sequência, precisão e revisões vencidas;
- missão diária gamificada;
- vocabulário com recuperação ativa e SRS local;
- gramática em contexto com correção e explicação;
- ditado/listening usando voz espanhola disponível no navegador/SO;
- leitura com perguntas de recuperação;
- shadowing com gravação local do microfone;
- sessão diária intercalando habilidades e priorizando pontos fracos;
- mapa de domínio por habilidade e caderno de erros aberto até recuperação correta;
- variante de espanhol configurável (internacional, Espanha, México e Argentina);
- Trilha JW para vocabulário congregacional/bíblico, livros e abreviações da Bíblia, leitura pública, comentários e discursos;
- links para recursos oficiais do JW.org, sem copiar o conteúdo para o SIDES;
- backup JSON do progresso;
- persistência SQLite local;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança; sem CDN, analytics ou recursos externos.

## Trilha JW

A rota local `/jw.html` adiciona uma trilha especializada para quem precisa usar espanhol em uma congregação.

Ela inclui:

- 50 termos de alta utilidade para Bíblia, reuniões, congregação, ministério, leitura e discursos, com exemplos originais do SIDES;
- treino dos 66 livros da Bíblia: português → espanhol, abreviação → nome e nome → abreviação;
- leitura pública com gravação temporária no navegador e autoavaliação por rubricas;
- comentários de 30–60 segundos;
- trechos de discurso de 2–3 minutos;
- rubricas de exatidão, naturalidade, ritmo, modulação, ênfase, introdução/explicação de textos, simplicidade, convicção, pontos principais e conclusão;
- priorização adaptativa dos itens e rubricas mais fracos.

### Limite de conteúdo JW.org

O SIDES **não raspa, copia, armazena, redistribui nem incorpora** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org. Os termos de uso do site permitem visualizar/baixar conteúdo para uso pessoal, mas restringem sua reprodução em outros aplicativos.

Por isso, quando um treino depender de uma leitura ou publicação, o SIDES abre o recurso oficial em outra aba e registra somente seu progresso. A gravação de treino permanece na memória da aba e não é persistida automaticamente.

Detalhes: `docs/JW-TRACK.md`.

## Pedagogia aplicada

O design prioriza:

1. **Retrieval practice / active recall** — tentar produzir a resposta antes de vê-la.
2. **Spaced repetition** — revisões voltam em intervalos adaptativos.
3. **Corrective feedback** — feedback imediatamente após a tentativa.
4. **Interleaving** — mistura vocabulário, gramática, escuta e leitura.
5. **Generation effect** — produção escrita e oral, não apenas reconhecimento.
6. **Multimodalidade** — texto, áudio, produção e contexto.
7. **Dificuldade desejável** — respostas precisam ser recuperadas, sem punição excessiva.
8. **Consistência** — streak mede atividade, não perfeição.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/` não é versionado;
- sem chaves, contas, nuvem ou cobrança;
- o código não exige serviço externo para funcionar.

## Módulos gratuitos planejados

- FSRS (`ts-fsrs`) para substituir o scheduler v1 mantendo os mesmos dados;
- `whisper.cpp` local para checagem de inteligibilidade da fala;
- Piper local para TTS espanhol reproduzível/offline;
- LanguageTool local para feedback gramatical livre;
- spaCy espanhol para lematização, frequência por texto e mineração de vocabulário;
- importadores opcionais de conteúdo aberto/public-domain.

Todos entram como adaptadores opcionais. Se ausentes, o núcleo continua funcionando.

## Desenvolvimento

```text
npm run check
```

Dados reais de estudo, gravações e backups nunca devem ser adicionados ao Git.
