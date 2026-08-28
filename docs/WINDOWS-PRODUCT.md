# SIDES — produto Windows instalável

O SIDES 1.0.0 é um produto Windows local e versionado, sem exigir Node.js, npm, Git ou acesso ao GitHub na máquina depois da instalação.

## Pacote

O build gera dois arquivos em `dist/`:

- `SIDES-<versão>-windows-x64.zip`;
- `SIDES-<versão>-windows-x64.zip.sha256`.

O ZIP contém:

- Node.js portátil em `payload/runtime/node.exe`;
- licença/avisos da distribuição Node em `payload/runtime/NODE-LICENSE.txt`;
- `THIRD_PARTY_NOTICES.md`;
- aplicação e `ts-fsrs@5.4.1`;
- instalador PowerShell + lançador VBS;
- launcher silencioso;
- atualizador local opt-in;
- rollback para a versão anterior;
- desinstalador;
- configuradores opcionais de Whisper e LanguageTool;
- `package-manifest.json` com tamanho e SHA-256 de cada arquivo;
- `package-manifest.sha256`.

Modelos de voz, Whisper, Piper e LanguageTool não são embutidos no pacote principal. Eles continuam opcionais e fora das pastas versionadas.

## Construção

Em Windows com Node 22.13+:

```powershell
.\BUILD-WINDOWS-PACKAGE.ps1
```

O build instala somente a dependência fixada quando necessário, copia o `node.exe` usado na construção, exige a licença da distribuição Node, gera/verifica o manifesto, compacta o pacote e cria o SHA-256 externo do ZIP.

O CI executa o mesmo processo em `windows-latest`, reabre o ZIP, verifica o manifesto, instala o pacote em uma raiz temporária e inicia o servidor usando o `node.exe` da versão efetivamente instalada.

## Instalação

1. Mantenha o ZIP e seu `.sha256` juntos para futuras atualizações.
2. Extraia o ZIP.
3. Execute `INSTALAR-SIDES.vbs`.

Padrão de instalação:

```text
%LOCALAPPDATA%\SIDES\
  data\                       <- persistente; nunca pertence a uma versão
  versions\1.0.0\            <- aplicação imutável daquela versão
    runtime\node.exe
    runtime\NODE-LICENSE.txt
    src\
    public\
    node_modules\ts-fsrs\
  SIDES.vbs
  Run-SIDES.ps1
  Atualizar-SIDES.vbs
  Update-SIDES.ps1
  Rollback-SIDES.vbs
  Rollback-SIDES.ps1
  Desinstalar-SIDES.ps1
  CONFIGURAR-VOZ-OFFLINE.ps1
  CONFIGURAR-GRAMATICA-LOCAL.ps1
  install-state.json
```

O instalador cria atalhos no Desktop e no Menu Iniciar. O atalho principal usa `wscript.exe` e inicia o servidor com janela oculta.

## Dados

O launcher define `SIDES_DATA_DIR` e o banco respeita essa variável. Na instalação padrão:

```text
%LOCALAPPDATA%\SIDES\data\sides.sqlite
```

Backups, logs e arquivos de recuperação do Bloco 11 ficam abaixo da mesma pasta de dados.

Uma atualização instala uma nova pasta em `versions\<versão>` e altera somente o estado da aplicação. A pasta `data` não é copiada, limpa nem substituída.

## Atualização opt-in

Abra **Atualizar SIDES** pelo Menu Iniciar. O atualizador solicita um pacote ZIP local.

A atualização somente prossegue quando:

1. existe o arquivo externo `<pacote>.zip.sha256`;
2. o SHA-256 do ZIP coincide;
3. o pacote extraído contém `SIDES-WINDOWS-PACKAGE-V1`;
4. o manifesto interno e todos os arquivos passam pela verificação;
5. a versão recebida é maior que a instalada;
6. Node portátil, licença do runtime e `ts-fsrs` exigidos estão presentes.

O atualizador não consulta GitHub, não baixa código e não substitui o banco. Após instalar a nova versão, reinicia somente o servidor local quando consegue confirmar que a porta 4317 pertence ao próprio SIDES.

## Rollback de aplicação

O Menu Iniciar oferece **Restaurar versão anterior** quando `install-state.json` possui uma versão anterior válida.

O rollback:

- valida o estado `SIDES-INSTALL-V1`;
- confirma a pasta e a versão anterior;
- encerra apenas um processo identificado como SIDES pela API local;
- troca `current` e `previous`;
- preserva `dataDir` sem mover, apagar ou sobrescrever o SQLite;
- reabre a versão restaurada.

Rollback de aplicação não restaura dados. Para regressão do banco use os backups/restauração da área **Integridade e backup**.

## Offline e componentes opcionais

A aplicação básica funciona sem GitHub e sem internet depois da instalação.

Se Whisper ou LanguageTool já tiverem sido configurados, seus arquivos ficam em diretórios estáveis como `tools/` e `models/`, fora de `versions/`. O launcher redetecta esses componentes em cada início.

A configuração inicial desses componentes é opcional e pode exigir internet para baixar os binários/modelos previstos nos scripts específicos.

## Desinstalação

**Desinstalar SIDES** remove aplicação, atalhos e estado de instalação, mas preserva os dados por padrão.

A exclusão definitiva da pasta de dados só ocorre com `-RemoveData` e uma segunda confirmação.

## Integridade e confiança

O checksum externo e o manifesto interno detectam corrupção ou alteração acidental do pacote. A release 1.0 também possui auditoria de segurança/dependências, notices de terceiros, testes E2E, gate de instalação Windows real e roteiro de aceitação.

O pacote não possui assinatura Authenticode própria nesta etapa. Por isso, integridade criptográfica por SHA-256 e cadeia de CI são registradas como controles atuais; assinatura de código pode ser adicionada no backlog pós-1.0 se houver certificado e política de distribuição adequados.

Detalhes adicionais: `docs/RELEASE-1.0.md`, `docs/LICENSE-AUDIT.md` e `docs/ACCEPTANCE-1.0.md`.
