#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/backup.db" >&2
  exit 1
fi

BACKUP_FILE="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

DATA_DIR="${RF_DATA_DIR:-$ROOT_DIR/data}"
DB_BASENAME="$(basename "${DATABASE_PATH:-/app/data/research-flow.db}")"
TARGET_DB="$DATA_DIR/$DB_BASENAME"

mkdir -p "$DATA_DIR"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop app
cp "$BACKUP_FILE" "$TARGET_DB"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start app

echo "Database restored to: $TARGET_DB"
