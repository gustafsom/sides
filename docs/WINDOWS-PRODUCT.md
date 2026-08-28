# SIDES — produto Windows instalável

O Bloco 12 transforma o SIDES em um produto Windows local e versionado, sem exigir Node.js, npm, Git ou acesso ao GitHub na máquina depois da instalação.

## Pacote

O build gera dois arquivos em `dist/`:

- `SIDES-<versão>-windows-x64.zip`;
- `SIDES-<versão>-windows-x64.zip.sha256`.

O ZIP contém:

- Node.js portátil em `payload/runtime/node.exe`;
- aplicação e `ts-fsrs@5.4.1`;
- instalador PowerShell + lançador VBS;
- launcher silencioso;
- atualizador local opt-in;
- desinstalador;
- configuradores opcionais de Whisper e LanguageTool;
- `package-manifest.json` com tamanho e SHA-256 de cada arquivo;
- `package-manifest.sha256`.

Modelos de voz, Whisper e LanguageTool não são embutidos no pacote principal. Eles continuam opcionais e permanecem fora das pastas versionadas.

## Construção

Em Windows com Node 22.13+:

```powershell
.\BUILD-WINDOWS-PACKAGE.ps1
```

O build instala apenas a dependência pinned quando necessário, copia o `node.exe` usado na construção, gera/verifica o manifesto, compacta o pacote e cria o SHA-256 externo do ZIP.

O CI executa o mesmo processo em `windows-latest`, reabre o ZIP, verifica o manifesto e inicia o servidor usando o `node.exe` contido no próprio pacote.

## Instalação

1. Mantenha o ZIP e seu `.sha256` juntos para futuras atualizações.
2. Extraia o ZIP.
3. Execute `INSTALAR-SIDES.vbs`.

Padrão de instalação:

```text
%LOCALAPPDATA%\SIDES\
  data\                       <- persistente; nunca pertence a uma versão
  versions\0.12.0\           <- aplicação imutável daquela versão
    runtime\node.exe
    src\
    public\
    node_modules\ts-fsrs\
  SIDES.vbs
  Run-SIDES.ps1
  Atualizar-SIDES.vbs
  Update-SIDES.ps1
  Desinstalar-SIDES.ps1
  CONFIGURAR-VOZ-OFFLINE.ps1
  CONFIGURAR-GRAMATICA-LOCAL.ps1
  install-state.json
```

O instalador cria atalhos no Desktop e no Menu Iniciar. O atalho principal usa `wscript.exe` e inicia o servidor com janela oculta.

## Dados

O launcher define `SIDES_DATA_DIR` e o banco passa a respeitar essa variável. Na instalação padrão:

```text
%LOCALAPPDATA%\SIDES\data\sides.sqlite
```

Backups, logs e arquivos de recuperação do Bloco 11 ficam abaixo da mesma pasta de dados.

Uma atualização instala uma nova pasta em `versions\<versão>` e altera somente `install-state.json`. A pasta `data` não é copiada, limpa nem substituída.

## Atualização opt-in

Abra **Atualizar SIDES** pelo Menu Iniciar. O atualizador solicita um pacote ZIP local.

A atualização somente prossegue quando:

1. existe o arquivo externo `<pacote>.zip.sha256`;
2. o SHA-256 do ZIP coincide;
3. o pacote extraído contém `SIDES-WINDOWS-PACKAGE-V1`;
4. o manifesto interno e todos os arquivos passam pela verificação;
5. a versão recebida é maior que a instalada;
6. o Node portátil e `ts-fsrs` exigidos estão presentes.

O atualizador não consulta GitHub, não baixa código e não substitui o banco. Após instalar a nova versão, reinicia apenas o servidor local do SIDES quando consegue confirmar que a porta 4317 pertence ao próprio SIDES.

## Offline e componentes opcionais

A aplicação básica funciona sem GitHub e sem internet depois da instalação.

Se Whisper ou LanguageTool já tiverem sido configurados, seus arquivos ficam em diretórios estáveis como `tools/` e `models/`, fora de `versions/`. O launcher redetecta esses componentes em cada início.

A configuração inicial desses componentes continua opcional e pode exigir internet para baixar os binários/modelos previstos nos scripts específicos.

## Desinstalação

**Desinstalar SIDES** remove aplicação, atalhos e estado de instalação, mas preserva os dados por padrão.

A exclusão definitiva da pasta de dados só ocorre com a opção explícita `-RemoveData` e uma segunda confirmação.

## Integridade e confiança

O checksum externo e o manifesto interno detectam corrupção ou alteração acidental do pacote. Assinatura digital de código, auditoria final de dependências/licenças, release oficial, tag e política completa de rollback pertencem ao Bloco 13.
