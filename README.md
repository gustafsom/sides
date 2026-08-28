# SIDES

**Sistema de Imersão e Desenvolvimento em Espanhol** — aplicação local-first para estudar espanhol com prática ativa, repetição espaçada, feedback explicativo, interleaving e gamificação.

## Estado

MVP evolutivo `0.4.0` — roda somente em `127.0.0.1`, sem telemetria e sem APIs pagas.

O Bloco 4 consolidou o motor adaptativo: FSRS estável, frases/chunks, contraste português ↔ espanhol, explicações pedagógicas e dashboard de evolução.

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
- microfone apenas para gravação de shadowing/leitura/discurso.

## O que já funciona

- diagnóstico inicial A1–B2;
- painel com XP, nível, sequência, precisão, erros abertos e revisões vencidas;
- **dashboard pedagógico** com evolução em 30 dias, tendência semanal, retenção estimada, dívida de revisão e prioridades;
- **índice de atenção 0–100** por habilidade, combinando domínio, erros abertos, erros recentes, tendência e tempo sem prática;
- ação **Treinar** diretamente no ponto fraco identificado;
- missão diária gamificada;
- vocabulário com recuperação ativa e **FSRS**;
- frases/chunks como unidades de recuperação;
- contraste português ↔ espanhol e falsos cognatos;
- explicação “Entender o correto” quando há erro, dificuldade ou padrão que merece revisão;
- gramática em contexto com correção, explicação e treino direcionado;
- ditado/listening usando voz espanhola disponível no navegador/SO;
- leitura com perguntas de recuperação;
- shadowing com gravação local do microfone;
- sessão diária intercalando habilidades e priorizando pontos fracos;
- redução temporária de conteúdo novo quando a dívida de revisões antigas fica alta;
- mapa de domínio por habilidade e caderno de erros aberto até recuperação correta;
- variante de espanhol configurável (internacional, Espanha, México e Argentina);
- Trilha JW para vocabulário congregacional/bíblico, livros e abreviações da Bíblia, leitura pública, comentários e discursos;
- Trilha JW integrada ao histórico de evolução por habilidade;
- links para recursos oficiais do JW.org, sem copiar conteúdo para o SIDES;
- backup JSON do progresso;
- persistência SQLite local;
- migração aditiva do banco V2 → V3, preservando dados existentes;
- binding exclusivo a `127.0.0.1`;
- CSP e headers de segurança; sem CDN ou analytics.

## Como o motor adaptativo funciona

### FSRS

A partir da versão 0.4.0, novas revisões usam `ts-fsrs@5.4.1`. Estados antigos do scheduler simplificado são convertidos quando o item volta a ser revisado, sem zerar histórico, repetições, lapses ou intervalos existentes.

### Pontos que precisam de atenção

O SIDES calcula prioridade considerando, entre outros sinais:

1. domínio estimado da habilidade;
2. erros ainda não recuperados;
3. erros recentes;
4. comparação de precisão entre as duas últimas janelas de 14 dias;
5. tempo desde a última prática;
6. quantidade de evidências, evitando conclusões fortes com amostra pequena.

O painel explica **por que** um ponto recebeu prioridade e recomenda uma ação concreta.

### Explicações

Quando necessário, a correção não se limita a “certo/errado”. O treino pode mostrar:

- a forma esperada;
- a regra ou contraste relevante;
- exemplo em contexto;
- orientação objetiva para praticar novamente.

## Trilha JW

A rota local `/jw.html` oferece uma trilha especializada para espanhol usado em congregação, leitura bíblica, comentários e discursos.

O SIDES **não raspa, copia, armazena, redistribui nem incorpora** versículos, artigos, publicações, imagens, vídeos ou áudios do JW.org. Conteúdo oficial continua no JW.org/JW Library; o SIDES registra somente dados do treino e progresso.

Detalhes: `docs/JW-TRACK.md`.

## Privacidade e custos

- progresso em `data/sides.sqlite`;
- `data/` não é versionado;
- sem conta, token, telemetria ou API paga;
- `ts-fsrs` é executado localmente;
- voz gravada no MVP não é enviada a serviços externos;
- módulos futuros de voz/NLP continuam opt-in e locais.

## Validação

```text
npm run check
```

O GitHub Actions executa o gate em Node 24 usando a versão fixada das dependências. Dados reais de estudo, gravações e backups nunca devem ser adicionados ao Git.
