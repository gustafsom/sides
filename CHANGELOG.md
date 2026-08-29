# Changelog

Todas as mudanças relevantes do CURESP são registradas neste arquivo a partir da versão 1.0.0.

## [1.1.0] - Em desenvolvimento

### Melhorado
- diagnóstico com opções alinhadas, área de clique consistente e foco de teclado visível;
- contraste de links, textos auxiliares, bordas e estados de foco no tema escuro;
- navegação persistente no painel para localizar rapidamente trilha, imersão, fala, escrita, designações, Trilha JW e dados;
- Trilha de hoje reduzida a uma sessão guiada de 12 passos e realmente intercalada entre habilidades;
- indicador de progresso `Passo X de Y` durante a trilha e condução automática para a próxima habilidade;
- distinção mais clara entre a Trilha de hoje e os atalhos de treino rápido por habilidade;
- explicações de gramática com linguagem cotidiana, “Em palavras simples” e “Atalho mental”, mantendo a regra resumida como detalhe opcional;
- textos visíveis restantes atualizados para a identidade CURESP.

### Compatibilidade
- banco, API, exportação, SQLite e demais contratos internos `SIDES-*` permanecem inalterados;
- a release imutável `v1.0.0` não é modificada.

## [1.0.0] - 2026-08-29

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

### Identidade CURESP
- o nome de produto usado durante o desenvolvimento, SIDES, foi substituído por **CURESP** antes da primeira release formal;
- interface, inicialização, instalador, atalhos, pacote Windows, CI, documentação e gate SISDEV usam CURESP;
- o pacote oficial é `CURESP-1.0.0-windows-x64.zip`;
- IDs técnicos SIDES já validados são mantidos apenas como contratos legados para evitar migração do banco e risco ao progresso.

### Segurança e privacidade
- servidor limitado a `127.0.0.1`;
- CSP, `nosniff`, política de referrer e `frame-ancestors 'none'`;
- frontend sem CDN/analytics;
- texto livre, áudio e transcrições fora do banco conforme os respectivos módulos;
- pacote Windows com manifesto/checksums e SHA-256 externo;
- auditoria de dependências e allowlist de runtime para a release.

### Compatibilidade técnica
- banco: `SIDES-DB-V10`;
- API local: `SIDES-API-V9`;
- exportação: `SIDES-EXPORT-V9`;
- pacote Windows: `SIDES-WINDOWS-PACKAGE-V1`;
- estado de instalação: `SIDES-INSTALL-V1`;
- SQLite: `sides.sqlite`;
- variáveis de runtime: `SIDES_*`.

Esses identificadores não definem a marca; são preservados para compatibilidade do formato 1.0.

### Observações
- Whisper, LanguageTool e Piper continuam opcionais e não são incorporados ao pacote padrão;
- o repositório do CURESP não passa a ter uma licença open source por inferência; consulte `docs/LICENSE-AUDIT.md`;
- a tag final `v1.0.0` deve apontar somente para um commit aprovado pelos gates Linux, segurança, Windows e CURESP/SISDEV local.
