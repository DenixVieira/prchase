# Guia de Backup e Recuperação — Sistema de Gestão de Compras

Este guia explica como fazer backup e restaurar os dois volumes Docker que guardam todos os dados persistentes do sistema:

- **`postgres_data`** — o banco de dados PostgreSQL completo (usuários, departamentos, organizações, solicitações de compra, tickets, comentários, histórico, auditoria, configurações etc.).
- **`backend_uploads`** — os anexos enviados nos tickets.

Os comandos abaixo usam os nomes fixos dos containers (`purchase_postgres` e `purchase_backend`, definidos em `docker-compose.yml`), então funcionam independentemente do nome da pasta onde o projeto foi extraído.

**Pré-requisitos:** Docker e Docker Compose instalados, e o sistema já subido pelo menos uma vez (`docker compose up -d`) a partir da pasta do projeto.

---

## 1. Backup no Linux

Abra um terminal na pasta raiz do projeto (onde está o `docker-compose.yml`).

### 1.1 Backup do banco de dados

```bash
mkdir -p backups

# Gera o dump dentro do próprio container (formato "custom": compactado e
# compatível com pg_restore, o que a seção 3 usa para restaurar).
docker exec purchase_postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f /tmp/backup.dump'

# Copia o dump para a máquina host, com timestamp no nome.
STAMP=$(date +%Y%m%d_%H%M%S)
docker cp purchase_postgres:/tmp/backup.dump "backups/banco_${STAMP}.dump"

# Remove o arquivo temporário de dentro do container.
docker exec purchase_postgres rm /tmp/backup.dump

echo "Backup do banco salvo em backups/banco_${STAMP}.dump"
```

### 1.2 Backup dos anexos

```bash
STAMP=$(date +%Y%m%d_%H%M%S)

docker run --rm --volumes-from purchase_backend -v "$(pwd)/backups:/backup" alpine \
  tar czf "/backup/anexos_${STAMP}.tar.gz" -C / app/uploads

echo "Backup dos anexos salvo em backups/anexos_${STAMP}.tar.gz"
```

Isso cria um container temporário e descartável (`--rm`) que só existe para ler o volume de uploads (montado via `--volumes-from purchase_backend`) e compactá-lo — não afeta o sistema em execução.

### 1.3 Automatizando com cron (opcional, recomendado)

Salve os dois blocos acima em um script `backup.sh` na raiz do projeto, dê permissão de execução (`chmod +x backup.sh`) e agende no crontab:

```bash
crontab -e
# Roda todo dia às 2h da manhã:
0 2 * * * cd /caminho/completo/para/purchase-system && ./backup.sh >> backups/backup.log 2>&1
```

---

## 2. Backup no Windows (PowerShell)

Abra o PowerShell na pasta raiz do projeto. Funciona com Docker Desktop (WSL2 ou Hyper-V).

### 2.1 Backup do banco de dados

```powershell
New-Item -ItemType Directory -Force -Path backups | Out-Null

docker exec purchase_postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f /tmp/backup.dump'

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
docker cp purchase_postgres:/tmp/backup.dump "backups/banco_$stamp.dump"
docker exec purchase_postgres rm /tmp/backup.dump

Write-Host "Backup do banco salvo em backups/banco_$stamp.dump"
```

### 2.2 Backup dos anexos

```powershell
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"

docker run --rm --volumes-from purchase_backend -v "${PWD}/backups:/backup" alpine `
  tar czf "/backup/anexos_$stamp.tar.gz" -C / app/uploads

Write-Host "Backup dos anexos salvo em backups/anexos_$stamp.tar.gz"
```

### 2.3 Automatizando com o Agendador de Tarefas (opcional, recomendado)

1. Salve os comandos acima em um arquivo `backup.ps1` na raiz do projeto.
2. Abra o **Agendador de Tarefas** do Windows → **Criar Tarefa Básica**.
3. Defina a frequência (ex.: diariamente, às 2h).
4. Em "Ação", escolha **Iniciar um programa**:
   - Programa: `powershell.exe`
   - Argumentos: `-NoProfile -ExecutionPolicy Bypass -File "C:\caminho\completo\para\purchase-system\backup.ps1"`
5. Marque para rodar mesmo com o usuário desconectado, se aplicável.

---

## 3. Restauração/Recuperação no Linux

**Antes de restaurar**, pare o backend para evitar gravações concorrentes durante o processo:

```bash
docker compose stop backend
```

### 3.1 Restaurar o banco de dados

```bash
# Copia o dump escolhido para dentro do container.
docker cp backups/banco_XXXXXXXX_XXXXXX.dump purchase_postgres:/tmp/restore.dump

# --clean --if-exists apaga os objetos existentes antes de recriá-los a
# partir do dump, então isso substitui completamente os dados atuais.
docker exec purchase_postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/restore.dump'

docker exec purchase_postgres rm /tmp/restore.dump
```

### 3.2 Restaurar os anexos

```bash
docker run --rm --volumes-from purchase_backend -v "$(pwd)/backups:/backup" alpine \
  sh -c "rm -rf /app/uploads/* && tar xzf /backup/anexos_XXXXXXXX_XXXXXX.tar.gz -C /"
```

### 3.3 Suba o sistema novamente

```bash
docker compose up -d
# Se o backup for de uma versão anterior do sistema, rode as migrations pendentes:
docker compose exec backend npm run migration:run
```

---

## 4. Restauração/Recuperação no Windows (PowerShell)

```powershell
docker compose stop backend
```

### 4.1 Restaurar o banco de dados

```powershell
docker cp backups/banco_XXXXXXXX_XXXXXX.dump purchase_postgres:/tmp/restore.dump
docker exec purchase_postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/restore.dump'
docker exec purchase_postgres rm /tmp/restore.dump
```

### 4.2 Restaurar os anexos

```powershell
docker run --rm --volumes-from purchase_backend -v "${PWD}/backups:/backup" alpine `
  sh -c "rm -rf /app/uploads/* && tar xzf /backup/anexos_XXXXXXXX_XXXXXX.tar.gz -C /"
```

### 4.3 Suba o sistema novamente

```powershell
docker compose up -d
docker compose exec backend npm run migration:run
```

---

## 5. Recuperação completa em um servidor novo (do zero)

Use este roteiro se o servidor original foi perdido e você está reconstruindo tudo em uma máquina nova (Windows ou Linux — os comandos `docker`/`docker compose` são os mesmos nas duas plataformas a partir daqui).

1. Instale Docker e Docker Compose na máquina nova.
2. Extraia o projeto (o mesmo `.zip` entregue, ou o repositório) em uma pasta.
3. Recrie o arquivo `.env` na raiz do projeto **com as mesmas credenciais usadas no backup** (`POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`) — se forem diferentes, a restauração do dump falha ou cria um banco vazio sob outro nome de usuário. Guarde o `.env` original junto dos backups, ele não fica dentro dos volumes.
4. Suba apenas o Postgres primeiro: `docker compose up -d postgres` e aguarde ele ficar saudável (`docker compose ps`).
5. Restaure o dump do banco (seção 3.1 ou 4.1).
6. Suba o backend uma vez para o volume `backend_uploads` ser criado: `docker compose up -d backend`, depois pare-o (`docker compose stop backend`) e restaure os anexos (seção 3.2 ou 4.2).
7. Suba o restante do sistema: `docker compose up -d`.
8. Rode as migrations, caso o backup seja de uma versão anterior: `docker compose exec backend npm run migration:run`.
9. Acesse o sistema e confira se os dados e os anexos estão presentes.

---

## 6. Boas práticas

- Faça backups **diários**, no mínimo — ou com mais frequência se o volume de solicitações/tickets for alto.
- Guarde cópias **fora do servidor** (nuvem, outro disco físico, outro site) — nunca dependa só de um backup salvo na mesma máquina.
- **Teste a restauração periodicamente** em um ambiente separado (não em produção) para garantir que os backups realmente funcionam quando forem necessários.
- Faça backup também do arquivo `.env` (credenciais e segredos como `JWT_SECRET`), guardado separadamente com acesso restrito. Sem ele, a restauração do banco pode falhar por credenciais divergentes; perder só o `JWT_SECRET` não é grave — apenas invalida sessões ativas, exigindo novo login.

---

## 7. Solução de problemas

- **`role "..." does not exist` ao restaurar** — o `POSTGRES_USER` usado no backup é diferente do `.env` atual. Ajuste o `.env` para usar o mesmo usuário do backup, ou recrie o dump com `--no-owner` no `pg_dump`.
- **Anexos aparecem com erro de permissão após restaurar** — rode `docker compose restart backend`; o container ajusta as permissões da pasta `/app/uploads` na inicialização.
- **Backend não conecta ao banco após restaurar** — confira se o Postgres terminou de subir (`docker compose logs postgres`) antes de subir o backend; o backend já tenta reconectar automaticamente por até 1 minuto, mas se o Postgres não ficar saudável nesse tempo, reinicie o backend com `docker compose restart backend`.
