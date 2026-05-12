#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/$(date +%Y%m%d-%H%M%S)}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

mkdir -p "$BACKUP_DIR"
pg_dump --format=custom --file="$BACKUP_DIR/postgres.dump" "$DATABASE_URL"

if [ -d "$ROOT_DIR/data/images" ]; then
  tar -C "$ROOT_DIR" -czf "$BACKUP_DIR/images.tar.gz" data/images
fi

if [ -f "$ROOT_DIR/.env" ]; then
  install -m 600 "$ROOT_DIR/.env" "$BACKUP_DIR/env.snapshot"
fi

echo "{\"backupDir\":\"$BACKUP_DIR\"}"
