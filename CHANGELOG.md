# Changelog

Todas as mudanças relevantes do SIDES são registradas neste arquivo a partir da versão 1.0.0.

## [1.0.0] - 2026-08-28

### Adicionado
- diagnóstico e currículo original A1–B2;
- FSRS 5.4.1, domínio adaptativo e caderno de erros;
- Trilha JW e preparação de designações sem incorporar textos oficiais;
- fala offline com Whisper opcional e métricas sem persistência de áudio/transcrição;
- escrita inteligente com LanguageTool local opcional e sem persistência do texto produzido;
- imersão com cenários ramificados e histórias graduadas;
- planejador diário, metas e XP efetivo com proteção anti-farming;
- backup SQLite automático, exportação/importação completa e restauração validada;
- produto Windows x64 com Node portátil, instalação versionada e dados separados;
- rollback para a versão anterior sem alterar a pasta de dados;
- testes E2E de release, auditoria de segurança/licenças e gate local SISDEV.

### Segurança e privacidade
- servidor limitado a `127.0.0.1`;
- CSP, `nosniff`, política de referrer e `frame-ancestors 'none'`;
- frontend sem CDN/analytics;
- texto livre, áudio e transcrições fora do banco conforme os respectivos módulos;
- pacote Windows com manifesto/checksums e SHA-256 externo;
- auditoria de dependências e allowlist de runtime para a release.

### Compatibilidade
- banco: `SIDES-DB-V10`;
- API local: `SIDES-API-V9`;
- exportação: `SIDES-EXPORT-V9`;
- pacote Windows: `SIDES-WINDOWS-PACKAGE-V1`;
- estado de instalação: `SIDES-INSTALL-V1`.

### Observações
- Whisper, LanguageTool e Piper continuam opcionais e não são incorporados ao pacote padrão;
- o repositório do SIDES não passa a ter uma licença open source por inferência; consulte `docs/LICENSE-AUDIT.md`;
- a tag final `v1.0.0` deve apontar somente para um commit aprovado pelos gates Linux, segurança, Windows e SISDEV local.
