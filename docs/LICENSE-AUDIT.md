# Auditoria de licenças — SIDES 1.0.0

Data da revisão: 2026-08-28.

Esta revisão é técnica e não constitui parecer jurídico.

## Resultado

O pacote padrão do SIDES 1.0.0 redistribui somente o runtime Node.js e `ts-fsrs@5.4.1` como componentes de terceiros. Whisper, LanguageTool e Piper permanecem opcionais e fora do pacote.

### Node.js

O runtime portátil é redistribuído para permitir execução do SIDES sem instalação prévia de Node/npm. O build da release exige a presença do arquivo de licença da distribuição Node e o copia para `payload/runtime/NODE-LICENSE.txt`. Se a licença não puder ser localizada, o build deve falhar de forma fechada.

### ts-fsrs 5.4.1

Licença declarada pelo pacote: MIT. O pacote inteiro é copiado para o runtime, mantendo seu arquivo de licença. A versão continua fixada em `5.4.1`.

### whisper.cpp

Licença do software: MIT. Não é redistribuído pelo pacote. O usuário pode instalá-lo por ação explícita através do configurador separado.

### LanguageTool

O core é distribuído sob GNU LGPL 2.1; os próprios mantenedores registram que recursos podem ter licenças diferentes. O SIDES não redistribui LanguageTool: o configurador separado baixa a distribuição original para uso local.

### Piper

A implementação atual do projeto de referência usa GPL-3.0. Para evitar incorporar uma obrigação de redistribuição não planejada, o SIDES não inclui Piper nem modelos de voz na release. A integração permanece apenas como adaptador opcional para instalação feita separadamente pelo usuário.

## Licença do próprio SIDES

O repositório do SIDES não declara atualmente uma licença open source própria. O Bloco 13 não inventa nem atribui uma licença ao código do usuário. Isso não impede o proprietário do repositório de produzir seu próprio pacote/release, mas terceiros não devem presumir permissão de redistribuição do código do SIDES.

Se o projeto passar a ser distribuído para terceiros sob uma licença específica, essa decisão deve ser registrada separadamente antes da distribuição externa do código-fonte.

## Gate

Antes de cada release:

1. executar `npm run security:check`;
2. confirmar `ts-fsrs` fixado e licença esperada;
3. construir o pacote Windows e confirmar `NODE-LICENSE.txt`;
4. revisar qualquer nova dependência antes de incluí-la na allowlist;
5. manter Whisper, LanguageTool e Piper fora do pacote enquanto suas estratégias de distribuição não forem alteradas deliberadamente.
