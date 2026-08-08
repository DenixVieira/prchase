# Backup automatizado do Sistema de Gestao de Compras — banco (Postgres) e anexos.
# Ver BACKUP_RECOVERY.md, secao 2.3, para agendar via Agendador de Tarefas do Windows.

Set-Location -Path $PSScriptRoot

New-Item -ItemType Directory -Force -Path backups | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path "backups" "backup.log"

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

try {
    Write-Log "Iniciando backup..."

    # Aspas simples só por fora (sem aspas duplas aninhadas por dentro) — o
    # PowerShell 5.1 costuma embaralhar aspas duplas dentro de simples ao
    # montar a linha de comando para um executável nativo como o docker.exe.
    docker exec purchase_postgres sh -c 'pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -F c -f /tmp/backup.dump'
    if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou (codigo $LASTEXITCODE)" }

    docker cp purchase_postgres:/tmp/backup.dump "backups/banco_$stamp.dump"
    if ($LASTEXITCODE -ne 0) { throw "docker cp do dump falhou (codigo $LASTEXITCODE)" }

    docker exec purchase_postgres rm /tmp/backup.dump
    Write-Log "Backup do banco salvo em backups/banco_$stamp.dump"

    docker run --rm --volumes-from purchase_backend -v "$PSScriptRoot\backups:/backup" alpine tar czf "/backup/anexos_$stamp.tar.gz" -C / app/uploads
    if ($LASTEXITCODE -ne 0) { throw "backup dos anexos falhou (codigo $LASTEXITCODE)" }
    Write-Log "Backup dos anexos salvo em backups/anexos_$stamp.tar.gz"

    Write-Log "Backup concluido com sucesso."
} catch {
    Write-Log "ERRO: $_"
    exit 1
}
