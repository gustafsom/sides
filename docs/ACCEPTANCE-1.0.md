# Roteiro de aceitação — SIDES 1.0.0

## Gates automatizados

- [ ] `npm run check` sem falhas.
- [ ] testes E2E servem `/`, `/api/health`, dashboard, currículo, planejador, JW, imersão, integridade e exportação.
- [ ] tentativa de path traversal e API desconhecida falham fechadas.
- [ ] headers de segurança presentes e CORS permissivo ausente.
- [ ] migração legada V2 → `SIDES-DB-V10` continua verde.
- [ ] `npm run security:check` sem finding de severidade alta.
- [ ] `npm audit --omit=dev --audit-level=high` verde.
- [ ] `npm run release:gate` verde.
- [ ] build Windows produz ZIP + SHA-256.
- [ ] pacote contém licença do Node e licença de `ts-fsrs`.
- [ ] pacote reextraído passa na verificação de manifesto.
- [ ] instalação Windows real em diretório temporário cria `SIDES-INSTALL-V1`.
- [ ] servidor instalado usa o Node portátil e responde `SIDES-API-V9`.
- [ ] SQLite é criado exclusivamente no `SIDES_DATA_DIR` do teste.

## Aceitação funcional local

Executar no Windows sobre o SHA exato candidato à release:

```powershell
.\SISDEV-GATE.ps1 -ExactSha <SHA-DE-40-CARACTERES>
```

O resultado deve indicar `ok: true` em `SIDES-GATE-safe.json`. Esse arquivo não contém caminhos locais, dados de estudo, respostas, áudio, transcrições, banco ou secrets.

Após instalar o pacote candidato:

- [ ] abrir SIDES pelo atalho sem terminal visível;
- [ ] painel principal carregar;
- [ ] executar uma revisão curta;
- [ ] abrir Planejador diário;
- [ ] abrir Trilha JW e Minhas designações;
- [ ] abrir Fala offline mesmo sem Whisper configurado;
- [ ] abrir Escrita mesmo sem LanguageTool configurado;
- [ ] abrir Imersão;
- [ ] em Integridade e backup, executar `quick_check`;
- [ ] criar backup manual e confirmar presença na lista;
- [ ] fechar e abrir o SIDES preservando progresso;
- [ ] confirmar que uma atualização não altera `dataDir`;
- [ ] quando houver versão anterior, testar **Restaurar versão anterior** e confirmar que o banco permanece no mesmo local.

## Privacidade

- [ ] nenhuma gravação de áudio persiste após a sessão;
- [ ] transcrição de fala não aparece no banco/backup;
- [ ] texto livre de escrita não aparece no banco/backup;
- [ ] respostas de imersão não aparecem no banco/backup;
- [ ] logs de manutenção não recebem conteúdo livre;
- [ ] frontend não carrega CDN ou analytics;
- [ ] servidor permanece em `127.0.0.1`.

## Critério de aceite

A tag `v1.0.0` só pode ser criada quando todos os gates automatizados do SHA final estiverem verdes e o gate SISDEV local desse mesmo SHA estiver aprovado. Itens funcionais locais que dependem de interação humana devem ser registrados como aceitos antes de distribuição externa da 1.0.
