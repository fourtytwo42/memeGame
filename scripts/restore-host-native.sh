#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$(pwd)}"
BACKUP_DIR="${1:?Usage: restore-host-native.sh <backup-dir>}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"

pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$BACKUP_DIR/postgres.dump"

if [ -f "$BACKUP_DIR/images.tar.gz" ]; then
  tar -C "$ROOT_DIR" -xzf "$BACKUP_DIR/images.tar.gz"
fi

echo "{\"restoredFrom\":\"$BACKUP_DIR\"}"
