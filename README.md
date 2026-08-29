# CURESP

**Curso de Espanhol** — aplicação local-first para desenvolver espanhol com prática ativa, imersão, repetição espaçada, feedback explicativo, fala, escrita, planejamento adaptativo e proteção local do progresso.

## Estado

**CURESP 1.0.0** — linha de chegada dos Blocos 1–13, incorporando a identidade anteriormente usada durante o desenvolvimento como SIDES.

A aplicação roda somente em `127.0.0.1`, não usa telemetria e não exige API paga. O produto Windows inclui runtime Node portátil, mantém código e dados separados, oferece backup/restauração e passa por gates Linux, Windows, segurança, licenças e release.

## Usar a partir do código-fonte

Windows / PowerShell:

```powershell
.\INICIAR-CURESP.ps1
```

Depois, abra `http://127.0.0.1:4317`.

Componentes opcionais:

```powershell
.\CONFIGURAR-VOZ-OFFLINE.ps1
.\CONFIGURAR-GRAMATICA-LOCAL.ps1
```

Whisper e LanguageTool não são necessários para abrir o CURESP. Sem eles, fala continua com comparação manual, escrita mantém as regras locais e Imersão funciona por texto.

## Produto Windows instalável

O build Windows cria:

```text
CURESP-1.0.0-windows-x64.zip
CURESP-1.0.0-windows-x64.zip.sha256
```

O pacote contém `node.exe`, sua licença/avisos, `ts-fsrs@5.4.1`, a aplicação, instalador e launcher. Depois da instalação, a máquina não precisa ter Node, npm, Git ou acesso ao GitHub para executar o CURESP.

Para construir em Windows:

```powershell
.\BUILD-WINDOWS-PACKAGE.ps1
```

Depois de extrair o ZIP, execute `INSTALAR-CURESP.vbs`. A instalação padrão fica em:

```text
%LOCALAPPDATA%\CURESP\
  data\
  versions\1.0.0\
  CURESP.vbs
  install-state.json
```

A pasta `data` é persistente e não pertence a nenhuma versão. O banco mantém o identificador técnico legado `sides.sqlite` e a variável interna `SIDES_DATA_DIR` para preservar compatibilidade com dados e automações já validados; isso não representa a marca exibida do produto.

O Menu Iniciar recebe atalhos para CURESP, atualização, **Restaurar versão anterior**, configuração opcional de voz/gramática e desinstalação. A inicialização principal usa `wscript.exe` e não abre janela de terminal.

A atualização é **opt-in**: o usuário escolhe um ZIP local. O CURESP exige SHA-256 externo, valida manifesto e cada arquivo, rejeita versão não superior e instala a nova aplicação em outra pasta de `versions/`. O banco não é substituído. O rollback troca somente o ponteiro de versão e mantém `dataDir` intacto.

## Requisitos do código-fonte

- Node.js 22.13+ (ambiente-alvo Node 24);
- npm na primeira preparação do código-fonte;
- navegador moderno;
- microfone apenas para fala/conversação oral;
- `whisper.cpp` opcional para transcrição local;
- Java 17+ apenas para LanguageTool local.

O pacote Windows principal já leva o runtime Node necessário.

## Currículo A1–B2

O conjunto gerado reúne **1.480** entradas lexicais/expressões, **640** frases/chunks, **320** exercícios de gramática, **200** itens de listening e **104** textos graduados. O seed deduplica linhas idênticas e o dashboard mede o SQLite real contra metas mínimas de **1.200 / 600 / 300 / 200 / 100**.

## Módulos principais

- **FSRS e motor adaptativo:** repetição espaçada, domínio por habilidade, caderno de erros, índice de atenção e dívida de revisão.
- **Trilha JW e designações:** vocabulário original, livros da Bíblia, leitura pública, comentários, discursos e preparação de designações; sem importar automaticamente texto oficial.
- **Fala offline:** `/speech.html`, Whisper opcional, métricas de correspondência/ritmo/pausas e nenhuma persistência de áudio/transcrição.
- **Escrita:** `/writing.html`, regras locais + LanguageTool opcional, reescrita deliberada e nenhuma persistência do texto produzido.
- **Imersão:** `/immersion.html`, 32 cenários ramificados e 16 histórias graduadas A1–B2.
- **Planejador:** `/planner.html`, metas diária/semanal, fila adaptativa e economia de XP com proteção anti-farming.
- **Integridade:** `/integrity.html`, `quick_check`, chaves estrangeiras, backup automático rotativo, importação transacional e restauração no reinício.

## Privacidade

- progresso no SQLite local;
- no modo instalado, dados ficam separados das versões da aplicação;
- backups, logs e recuperação permanecem na pasta persistente de dados;
- `data/`, `dist/`, binários opcionais, modelos e LanguageTool local não são versionados;
- sem conta, token, telemetria ou API paga;
- áudio/transcrição não entram no banco;
- textos de escrita e respostas de imersão não entram no banco;
- planos diários são derivados, não armazenados;
- logs de manutenção não recebem conteúdo livre do usuário;
- frontend sem CDN ou analytics;
- servidor exclusivo em `127.0.0.1` com CSP e headers defensivos.

## Qualidade, segurança e release 1.0

A 1.0 inclui:

- testes E2E HTTP de aceitação;
- auditoria estática de segurança e allowlist de dependências;
- `npm audit` para vulnerabilidades altas/críticas no gate de CI;
- auditoria de licenças e `THIRD_PARTY_NOTICES.md`;
- licença integral da distribuição Node dentro do pacote Windows;
- rollback de aplicação sem alteração da pasta de dados;
- instalação Windows real em diretório temporário no CI;
- `CURESP-GATE.ps1` fail-closed, preso a SHA exato e modo `READ_ONLY`;
- changelog, roteiro de aceitação e processo de tag/release.

A auditoria de 2026-08-28 constatou que a branch `main` não possui proteção/ruleset ativo no GitHub. Enquanto essa governança não for configurada, o processo exige PR, CI verde e merge com `expected_head_sha`.

## Validação

```text
npm install --ignore-scripts --no-audit --no-fund
npm run check
npm run security:check
npm run release:gate
npm audit --omit=dev --audit-level=high
```

Gate local SISDEV para o SHA candidato:

```powershell
.\CURESP-GATE.ps1 -ExactSha <SHA-DE-40-CARACTERES>
```

O resultado sanitizado fica em `%USERPROFILE%\Downloads\SISDEV\RESULTADOS\curesp\CURESP-GATE-safe.json` e não contém caminhos locais nem conteúdo de estudo.

## Compatibilidade técnica da 1.0

A mudança de nome **não cria migração de dados**. Para preservar o banco e os contratos já testados, estes IDs internos continuam com o prefixo histórico:

- banco: `SIDES-DB-V10`;
- API: `SIDES-API-V9`;
- exportação: `SIDES-EXPORT-V9`;
- pacote/estado interno: `SIDES-WINDOWS-PACKAGE-V1` / `SIDES-INSTALL-V1`;
- arquivo SQLite: `sides.sqlite`;
- variáveis internas de runtime: `SIDES_*`.

Esses nomes são protocolos internos de compatibilidade, não a identidade do produto. A identidade oficial a partir da Release 1.0 é **CURESP**.

Consulte também `CHANGELOG.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES.md`, `docs/LICENSE-AUDIT.md`, `docs/RELEASE-1.0.md` e `docs/ACCEPTANCE-1.0.md`.

Dados reais de estudo, gravações, textos produzidos, respostas de conversa, modelos, binários, bancos, backups e pacotes `dist/` nunca devem ser adicionados ao Git.
