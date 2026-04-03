#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

DATA_DIR="${RF_DATA_DIR:-$ROOT_DIR/data}"
DB_BASENAME="$(basename "${DATABASE_PATH:-/app/data/research-flow.db}")"
SOURCE_DB="$DATA_DIR/$DB_BASENAME"
BACKUP_PATH="${BACKUP_PATH:-$DATA_DIR/research-flow-$(date +%Y%m%d-%H%M%S).db}"

if [[ ! -f "$SOURCE_DB" ]]; then
  echo "SQLite database not found: $SOURCE_DB" >&2
  exit 1
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop app
cp "$SOURCE_DB" "$BACKUP_PATH"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start app

echo "Backup created: $BACKUP_PATH"
