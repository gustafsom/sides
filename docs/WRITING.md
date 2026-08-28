# Escrita inteligente — Bloco 8

A área `/writing.html` transforma produção escrita em evidência para o motor adaptativo do SIDES. O objetivo não é substituir professor, gramática de referência ou revisão humana; é tornar o ciclo **escrever → revisar → reescrever → recuperar o padrão** frequente, privado e mensurável.

## Fluxo

1. O SIDES oferece um tema compatível com o nível diagnosticado e, quando há histórico, prioriza uma habilidade de escrita mais fraca.
2. O usuário escreve em espanhol ou escolhe o modo de texto livre.
3. **Analisar sem salvar** executa a revisão e não cria uma tentativa no SQLite.
4. **Registrar tentativa** grava somente métricas e categorias do feedback.
5. As categorias sinalizadas alimentam domínio, eventos de habilidade e caderno de erros.
6. **Reescrever e comparar** vincula uma nova tentativa à anterior.
7. Se uma categoria antiga desaparece na reescrita, o SIDES registra recuperação daquele padrão.

## Conteúdo

O banco inicial contém 32 propostas originais:

- 8 A1;
- 8 A2;
- 8 B1;
- 8 B2.

Há situações de rotina, mensagens, viagem, trabalho, opinião, congregação e preparação de fala/discurso. Os prompts da congregação pedem produção com palavras próprias e não incorporam texto oficial do JW.org/JW Library.

Antes do diagnóstico, somente propostas A1 podem ser selecionadas.

## Corretores

### Regras SIDES

Sempre disponíveis e deliberadamente conservadoras. Nesta versão cobrem principalmente:

- algumas interferências portuguesas de alta confiança;
- formas frequentes sem acento;
- espaços duplicados/antes de pontuação;
- sinais de abertura `¿` e `¡` quando aplicáveis.

Essas regras não tentam ser um parser completo do espanhol.

### LanguageTool local

Opcional. O backend permite apenas HTTP em loopback. Uma configuração como `https://api.languagetool.org` ou qualquer host remoto resulta em bloqueio antes da chamada de rede.

Quando disponível, os alertas do LanguageTool são classificados pelo SIDES em padrões pedagógicos como:

- concordância;
- forma verbal;
- preposição;
- pronome;
- ser/estar;
- por/para;
- ortografia e acentuação;
- pontuação;
- maiúsculas/minúsculas;
- clareza/estilo;
- gramática geral.

A classificação é heurística e pode evoluir sem alterar o histórico bruto, que armazena apenas a categoria agregada.

## Índice de revisão

O índice 0–100 é calculado a partir da quantidade de palavras e do peso dos alertas disponíveis. Ele serve para comparar tentativas e orientar reescrita.

Ele **não é**:

- nota CEFR;
- garantia de correção gramatical;
- avaliação de conteúdo, lógica ou veracidade;
- substituto de revisão humana.

Corretores automáticos podem produzir falso positivo ou deixar erros passar.

## Persistência e privacidade

Sub-schema: `SIDES-WRITING-V1`.

`writing_attempts` armazena:

- identificador do prompt;
- tipo de contexto;
- tentativa anterior, quando for reescrita;
- contagem de palavras/caracteres;
- quantidade de alertas;
- índice de revisão;
- motor usado;
- tempo de resposta;
- data/hora.

`writing_issue_summary` armazena somente categoria e contagem por tentativa.

O banco **não possui campo para**:

- texto escrito;
- texto original;
- texto corrigido;
- sugestão completa;
- conteúdo de publicação.

O backup JSON segue a mesma fronteira.

Durante uma análise, o texto existe apenas no navegador, no request HTTP para `127.0.0.1` e na memória dos processos locais usados na correção. O SIDES não o envia intencionalmente a serviços externos.

## Instalação opcional do LanguageTool no Windows

Pré-requisito somente para o módulo opcional: Java 17+.

```powershell
.\CONFIGURAR-GRAMATICA-LOCAL.ps1
```

O configurador baixa `LanguageTool-6.6.zip`, valida SHA-256 e extrai para `tools/languagetool/`. O diretório é ignorado pelo Git.

Na abertura normal por `INICIAR-SIDES.ps1`, se a instalação estiver presente e Java 17+ estiver disponível, o launcher tenta iniciar o servidor em `127.0.0.1:8081`. Se isso falhar, o SIDES inicia normalmente com as regras próprias.

## API local

- `GET /api/writing/status`
- `GET /api/writing/overview?days=30`
- `GET /api/writing/prompt?skill=...`
- `POST /api/writing/check`
- `POST /api/writing/submit`

`/check` não persiste tentativa. `/submit` persiste métricas e integra o resultado ao motor adaptativo.
