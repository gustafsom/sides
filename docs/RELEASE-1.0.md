# Release SIDES 1.0.0

## Critério de release

A versão 1.0.0 só deve receber a tag `v1.0.0` quando o mesmo SHA tiver:

1. `npm run check` verde;
2. `npm run security:check` verde;
3. `npm run release:gate` verde;
4. `npm audit --omit=dev --audit-level=high` sem vulnerabilidade alta/crítica;
5. job Windows verde, incluindo build, verificação do pacote e instalação real em diretório temporário;
6. `SISDEV-GATE.ps1 -ExactSha <sha>` aprovado numa máquina Windows local com working tree limpa.

CI remoto não substitui o item 6. O gate SISDEV é intencionalmente local e gera somente um resultado sanitizado em `%USERPROFILE%\Downloads\SISDEV\RESULTADOS\sides\SIDES-GATE-safe.json`.

## Empacotamento

`BUILD-WINDOWS-PACKAGE.ps1` produz:

- `SIDES-1.0.0-windows-x64.zip`;
- `SIDES-1.0.0-windows-x64.zip.sha256`.

O ZIP possui manifesto interno com SHA-256 de cada arquivo. O runtime Node, a licença integral da distribuição Node e `ts-fsrs@5.4.1` são incluídos. Dados reais nunca entram no pacote.

## Instalação

A instalação padrão usa `%LOCALAPPDATA%\SIDES`:

- versões da aplicação: `versions\<versão>`;
- banco, backups, logs e recuperação: pasta `data` persistente;
- estado: `install-state.json`.

Atualizações criam uma nova pasta de versão e atualizam o ponteiro `current`; não movem nem sobrescrevem a pasta de dados.

## Rollback

O Menu Iniciar inclui **Restaurar versão anterior** quando houver uma versão anterior registrada. O rollback:

1. valida `SIDES-INSTALL-V1`;
2. confirma que a pasta anterior contém `package.json` válido;
3. encerra o processo local do SIDES somente se `/api/health` identificar a aplicação;
4. troca atomicamente `current` e `previous`;
5. mantém `dataDir` exatamente igual;
6. reinicia o SIDES, salvo quando executado com `-NoLaunch` em teste automatizado.

Rollback de aplicação não é rollback de banco. Como as migrações até `SIDES-DB-V10` são aditivas, a versão anterior escolhida deve ser compatível com o banco já migrado. Para regressão de dados, use o mecanismo de backup/restauração do Bloco 11.

## Branch protection

Na auditoria de 2026-08-28, `main` foi reportada pelo GitHub como `protected: false` e o repositório não possuía rulesets. Isso é uma limitação de governança, não uma característica desejada. Até a proteção ser configurada no GitHub, o processo do SIDES exige PR, CI verde e merge com `expected_head_sha` para reduzir o risco de merge de um SHA diferente do validado.

## Release e tag

A tag final deve ser anotada/imutável do ponto de vista do processo: `v1.0.0` aponta para o commit de `main` que passou todos os gates. Não mover/reutilizar a tag para outro SHA. Correções posteriores usam SemVer (`1.0.1`, `1.1.0`, etc.).
