#!/bin/bash
# ==============================================================================
# TANBOX Database Automated Backup Script
# Creates a compressed, timestamped PostgreSQL dump
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    # Source .env ignoring comments and blank lines safely
    eval $(grep -v '^#' "$PROJECT_DIR/.env" | grep -v '^$' | sed -e 's/^/export /') 2>/dev/null || true
    set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
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
