#!/bin/sh
# Backup automatizado do Sistema de Gestão de Compras — banco (Postgres) e anexos.
# Ver BACKUP_RECOVERY.md, seção 1.3, para agendar via cron.
set -e

cd "$(dirname "$0")"
mkdir -p backups
STAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="backups/backup.log"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

log "Iniciando backup..."

docker exec purchase_postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f /tmp/backup.dump'
docker cp purchase_postgres:/tmp/backup.dump "backups/banco_${STAMP}.dump"
docker exec purchase_postgres rm /tmp/backup.dump
log "Backup do banco salvo em backups/banco_${STAMP}.dump"

docker run --rm --volumes-from purchase_backend -v "$(pwd)/backups:/backup" alpine \
  tar czf "/backup/anexos_${STAMP}.tar.gz" -C / app/uploads
log "Backup dos anexos salvo em backups/anexos_${STAMP}.tar.gz"

log "Backup concluído com sucesso."
