#!/bin/bash
# ==============================================================================
# TANBOX Database Automated Backup Script
# Creates a compressed, timestamped PostgreSQL dump
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/tanbox_db_backup_$TIMESTAMP.sql.gz"

echo "📦 Starting TANBOX database backup..."

if ! docker ps | grep -q "tanbox_postgres"; then
    echo "❌ Error: tanbox_postgres container is not running!"
    exit 1
fi

docker exec -t tanbox_postgres pg_dump -U "${POSTGRES_USER:-tanbox_user}" "${POSTGRES_DB:-tanbox_db}" | gzip > "$FILENAME"

echo "✅ Backup successfully created at: $FILENAME"
echo "📊 Backup file size: $(du -h "$FILENAME" | cut -f1)"

# Retain backups for 14 days, delete older ones
find "$BACKUP_DIR" -type f -name "tanbox_db_backup_*.sql.gz" -mtime +14 -exec rm {} \;
echo "🧹 Old backups older than 14 days cleaned up."
