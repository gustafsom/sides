# Segurança e privacidade

O SIDES é uma aplicação local-first. A versão estável atual é a **1.0.x**.

## Versões suportadas

| Linha | Suporte |
|---|---|
| 1.0.x | suportada |
| 0.x | desenvolvimento histórico; atualizar para 1.0 |

Correções de segurança da linha estável devem incrementar SemVer e passar pelos mesmos gates de release.

## Invariantes

- O servidor padrão escuta somente `127.0.0.1`.
- O banco, backups, logs locais e arquivos de recuperação não devem ser versionados.
- O produto não exige conta, senha, token, analytics ou serviço remoto para funcionar.
- O front-end não carrega CDN, analytics ou scripts de terceiros.
- CSP bloqueia objetos e framing; `nosniff` e política de referrer são aplicados nas respostas.
- Texto livre, áudio e transcrições seguem as políticas de não persistência documentadas por módulo.
- LanguageTool remoto é bloqueado; Whisper/LanguageTool/Piper são opcionais e locais.
- Atualizações Windows são opt-in e exigem checksum externo + manifesto interno.
- Rollback de aplicação preserva a pasta de dados.

## Gate de segurança

Antes de uma release:

```text
npm run check
npm run security:check
npm run release:gate
npm audit --omit=dev --audit-level=high
```

O gate local SISDEV exige SHA Git completo e working tree limpa:

```powershell
.\SISDEV-GATE.ps1 -ExactSha <SHA-DE-40-CARACTERES>
```

Nenhum desses gates autoriza deploy, escrita remota ou execução arbitrária recebida de fora.

## Dependências e licenças

A release mantém uma allowlist mínima de dependências. Consulte `THIRD_PARTY_NOTICES.md` e `docs/LICENSE-AUDIT.md`. Alterar dependências ou passar a redistribuir Whisper, LanguageTool, Piper/modelos exige nova revisão antes da release.

## Reporte de vulnerabilidade

Não publique credenciais, dados pessoais, bancos, backups, gravações ou conteúdo de estudo em Issues públicas. Vulnerabilidades devem ser relatadas ao responsável pelo repositório por um canal privado disponível na organização/conta antes de divulgação pública.

Se um incidente envolver arquivos locais, preserve a evidência sem anexar dados reais ao GitHub. Registre apenas informações sanitizadas, como versão, SHA, código do erro e passos de reprodução sem conteúdo pessoal.

## Governança conhecida

Na auditoria de 2026-08-28, a API do GitHub reportou `main` como **não protegida** e nenhum ruleset estava configurado. Até que a proteção seja habilitada, merges de release devem usar PR, CI verde e `expected_head_sha`, e tags não devem ser movidas para outro commit.
