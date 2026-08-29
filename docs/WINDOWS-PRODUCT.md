# CURESP — produto Windows instalável

O CURESP 1.0.0 é um produto Windows local e versionado, sem exigir Node.js, npm, Git ou acesso ao GitHub na máquina depois da instalação.

## Pacote

O build gera dois arquivos em `dist/`:

- `CURESP-<versão>-windows-x64.zip`;
- `CURESP-<versão>-windows-x64.zip.sha256`.

O ZIP contém Node.js portátil, licença/avisos do Node, `THIRD_PARTY_NOTICES.md`, aplicação, `ts-fsrs@5.4.1`, instalador `INSTALAR-CURESP.vbs`/`.ps1`, launcher silencioso, atualizador local opt-in, rollback, desinstalador, configuradores opcionais e manifesto SHA-256.

Modelos de voz, Whisper, Piper e LanguageTool não são embutidos no pacote principal. Eles continuam opcionais e fora das pastas versionadas.

## Construção

Em Windows com Node 22.13+:

```powershell
.\BUILD-WINDOWS-PACKAGE.ps1
```

O CI executa o mesmo processo em `windows-latest`, reabre o ZIP, verifica o manifesto, instala pelo `INSTALAR-CURESP.ps1` em uma raiz temporária, confirma `CURESP.vbs` e inicia o servidor usando o `node.exe` da versão efetivamente instalada.

## Instalação

1. Mantenha o ZIP e seu `.sha256` juntos para futuras atualizações.
2. Extraia o ZIP.
3. Execute `INSTALAR-CURESP.vbs`.

Padrão de instalação:

```text
%LOCALAPPDATA%\CURESP\
  data\                       <- persistente; nunca pertence a uma versão
  versions\1.0.0\            <- aplicação imutável daquela versão
    runtime\node.exe
    runtime\NODE-LICENSE.txt
    src\
    public\
    node_modules\ts-fsrs\
  CURESP.vbs
  install-state.json
```

Alguns nomes de scripts e contratos internos ainda contêm `SIDES` por compatibilidade da versão 1.0. Eles não são atalhos ou identidade apresentados ao usuário.

## Dados

O launcher mantém a variável técnica legada `SIDES_DATA_DIR` e o arquivo `sides.sqlite` para evitar qualquer migração de dados. Na instalação padrão, o banco fica sob:

```text
%LOCALAPPDATA%\CURESP\data\sides.sqlite
```

Backups, logs e arquivos de recuperação ficam abaixo da mesma pasta persistente. Uma atualização instala nova pasta em `versions\<versão>` e altera somente o estado da aplicação; `data` não é copiada, limpa nem substituída.

## Atualização opt-in

Abra **Atualizar CURESP** pelo Menu Iniciar. O atualizador solicita um pacote ZIP local e somente prossegue quando checksum externo, manifesto interno, versão e runtime são válidos.

O atualizador não consulta GitHub, não baixa código e não substitui o banco. O protocolo interno do manifesto permanece `SIDES-WINDOWS-PACKAGE-V1` nesta release para compatibilidade.

## Rollback de aplicação

O Menu Iniciar oferece **Restaurar versão anterior** quando `install-state.json` possui uma versão anterior válida. O rollback valida o contrato interno `SIDES-INSTALL-V1`, troca `current`/`previous`, preserva `dataDir` e reabre o CURESP.

Rollback de aplicação não restaura dados. Para regressão do banco use os backups/restauração da área **Integridade e backup**.

## Offline e componentes opcionais

A aplicação básica funciona sem GitHub e sem internet depois da instalação. Whisper, LanguageTool e Piper continuam opcionais e locais.

## Desinstalação

**Desinstalar CURESP** remove aplicação, atalhos e estado de instalação, mas preserva os dados por padrão. A exclusão definitiva da pasta de dados só ocorre com `-RemoveData` e uma segunda confirmação.

## Integridade e confiança

O checksum externo e o manifesto interno detectam corrupção ou alteração acidental do pacote. A release 1.0 também possui auditoria de segurança/dependências, notices de terceiros, testes E2E, gate de instalação Windows real e roteiro de aceitação.

O pacote não possui assinatura Authenticode própria nesta etapa. Integridade SHA-256 e cadeia de CI são os controles atuais; assinatura de código pode ser adicionada no backlog pós-1.0 quando houver certificado e política adequados.

Detalhes adicionais: `docs/RELEASE-1.0.md`, `docs/LICENSE-AUDIT.md` e `docs/ACCEPTANCE-1.0.md`.
