# Segurança e privacidade

O SIDES é uma aplicação local-first.

- O servidor padrão escuta somente `127.0.0.1`.
- O banco `data/sides.sqlite` e backups locais não devem ser versionados.
- O produto não exige conta, senha, token, analytics ou serviço remoto para o MVP.
- O front-end não carrega recursos de terceiros.
- Não inclua dados sensíveis, credenciais ou material protegido por direitos autorais no repositório.
- Integrações futuras com ferramentas externas devem ser opt-in e preservar um caminho funcional totalmente local.

Relate vulnerabilidades em canal privado; não publique segredos ou dados pessoais em Issues.
