# Integridade, backup e recuperação — SIDES 0.11

O Bloco 11 protege o progresso local do SIDES sem adicionar serviço de nuvem, conta externa ou API paga. O banco principal continua em `data/sides.sqlite` e toda a manutenção permanece dentro de `data/`, que não é versionada.

## Verificação de integridade

A área `/integrity.html` executa duas verificações do SQLite:

- `PRAGMA quick_check`, para detectar inconsistências estruturais;
- `PRAGMA foreign_key_check`, para detectar vínculos inválidos.

O resultado também está disponível em `GET /api/integrity/status`. O estado mínimo de manutenção fica em `maintenance_state`; respostas de estudo e conteúdo produzido não são copiados para essa tabela.

## Backup SQLite

O SIDES usa a função nativa `backup()` de `node:sqlite`. Ela cria uma cópia consistente mesmo com o banco aberto em modo WAL. O fluxo é:

1. gravar em arquivo temporário `.partial`;
2. abrir a cópia como SQLite somente leitura;
3. executar `quick_check` e `foreign_key_check`;
4. conferir tabelas essenciais e versão SIDES;
5. calcular SHA-256;
6. somente então renomear para o nome definitivo e entrar na rotação.

Um arquivo que não passa na validação é apagado e não conta como backup válido.

### Política de rotação

- 14 backups automáticos;
- 10 backups manuais;
- 5 backups antes de importação JSON;
- 5 backups antes de preparar restauração SQLite.

O servidor tenta garantir um backup automático ao iniciar. Depois verifica a necessidade a cada 6 horas; um novo automático só é criado quando o mais recente tem 24 horas ou mais.

Arquivos ficam em `data/backups/`.

## Exportação JSON completa

`GET /api/export` gera `SIDES-EXPORT-V9`, formato `SIDES-JSON-BACKUP-V1`.

O V9 contém todas as tabelas da aplicação e um manifesto com a contagem de registros por tabela. Isso inclui configuração, progresso, FSRS, currículo, designações, métricas de fala/escrita/imersão e metas do planejador.

As fronteiras de privacidade dos blocos anteriores continuam valendo: áudio, transcrição de fala, texto produzido na escrita e respostas livres de imersão não passam a existir no backup porque não são persistidos nas respectivas tabelas.

## Importação JSON

A importação aceita backups SIDES V3 a V9. Para V9, o pacote precisa estar completo e o manifesto deve coincidir com as tabelas recebidas.

Antes de qualquer alteração:

1. o formato e as tabelas são validados;
2. tabelas desconhecidas são rejeitadas;
3. é criado um backup SQLite `preimport`.

A substituição dos dados ocorre em uma transação única. Antes do `COMMIT`, o SIDES executa `quick_check` e `foreign_key_check`. Se qualquer etapa falhar, faz `ROLLBACK`; o banco não deve ficar parcialmente importado.

Após importar um backup antigo, as migrações do código atual continuam sendo a fonte de verdade e o banco é promovido para o schema atual.

## Restauração SQLite

A restauração de um arquivo `.sqlite` é deliberadamente dividida em duas etapas para não substituir um arquivo que está aberto pelo processo.

### 1. Preparar

Na tela de integridade, selecione um `.sqlite` ou escolha um backup local. O SIDES:

- cria primeiro um backup `prerestore` do banco atual;
- valida o arquivo recebido;
- calcula SHA-256;
- salva uma cópia como `restore-pending.sqlite` e um marcador com o hash.

Nenhuma troca do banco principal ocorre nessa etapa.

### 2. Aplicar no próximo início

Feche o SIDES e abra novamente. Antes de abrir SQLite, o inicializador:

- valida novamente o arquivo pendente e o SHA-256;
- move o banco atual, WAL e SHM para `data/recovery/` quando existirem;
- coloca o banco restaurado como `data/sides.sqlite`;
- executa todas as migrações normais até `SIDES-DB-V10`.

Se a troca de arquivos falhar, o inicializador tenta devolver os arquivos anteriores aos caminhos originais.

## Logs locais

Eventos de integridade, backup, importação e restauração são registrados em `data/logs/SIDES-AAAA-MM-DD.jsonl`.

Os detalhes são filtrados por lista permitida. Não são aceitos campos arbitrários de conteúdo do usuário. A retenção padrão é de 30 dias, com exclusão automática de arquivos antigos.

## API do Bloco 11

- `GET /api/integrity/status`
- `POST /api/integrity/check`
- `POST /api/integrity/backup`
- `GET /api/integrity/backups/:filename`
- `POST /api/integrity/import`
- `POST /api/integrity/restore`
- `POST /api/integrity/restore-local`
- `GET /api/export`

A API permanece vinculada ao mesmo servidor local do SIDES em `127.0.0.1`.

## Recuperação em caso de problema

A ordem recomendada é:

1. abrir `/integrity.html` e verificar o banco;
2. se o banco atual ainda abrir, criar um backup manual antes de outras ações;
3. preferir restaurar o backup SQLite validado mais recente;
4. reiniciar o SIDES para aplicar;
5. conferir integridade e dados principais após a abertura;
6. usar importação JSON apenas quando a fonte disponível for um backup JSON.

Não copie arquivos de `data/recovery/` por cima do banco aberto. Eles existem como última camada de recuperação e devem ser tratados com o SIDES fechado.
