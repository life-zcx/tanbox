#!/bin/bash
# ==============================================================================
# TANBOX Database Automated Backup Script
# Creates a compressed, timestamped PostgreSQL dump
# ==============================================================================

set -euo pipefail
umask 077

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
DOCKER_BIN="${DOCKER_BIN:-docker}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    # Only parse the identifiers needed by pg_dump; never eval arbitrary dotenv text.
    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"
        case "$line" in
            POSTGRES_USER=*|POSTGRES_DB=*|BACKUP_DIR=*)
                key="${line%%=*}"
                value="${line#*=}"
                value="${value%\"}"; value="${value#\"}"
                value="${value%\'}"; value="${value#\'}"
                export "$key=$value"
                ;;
        esac
    done < "$PROJECT_DIR/.env"
    set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/tanbox_db_backup_$TIMESTAMP.sql.gz"

echo "📦 Starting TANBOX database backup..."

if [ "$("$DOCKER_BIN" inspect --format '{{.State.Running}}' tanbox_postgres 2>/dev/null || true)" != "true" ]; then
    echo "❌ Error: tanbox_postgres container is not running!"
    exit 1
fi

TEMP_FILE="$(mktemp "$BACKUP_DIR/.tanbox-backup.XXXXXX")"
trap 'rm -f -- "$TEMP_FILE"' EXIT

"$DOCKER_BIN" exec -i tanbox_postgres pg_dump -U "${POSTGRES_USER:-tanbox_user}" "${POSTGRES_DB:-tanbox_db}" | gzip > "$TEMP_FILE"
gzip -t "$TEMP_FILE"
# An empty gzip stream is not a database backup.
gzip -cd "$TEMP_FILE" | awk 'NR <= 20 && /PostgreSQL database dump/ { found=1 } END { exit !found }'
mv -- "$TEMP_FILE" "$FILENAME"
trap - EXIT

echo "✅ Backup successfully created at: $FILENAME"
echo "📊 Backup file size: $(du -h "$FILENAME" | cut -f1)"

# Retain backups for 14 days, delete older ones
find "$BACKUP_DIR" -type f -name "tanbox_db_backup_*.sql.gz" -mtime +14 -exec rm {} \;
echo "🧹 Old backups older than 14 days cleaned up."
