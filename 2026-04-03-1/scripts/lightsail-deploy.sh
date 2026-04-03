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

required_vars=(
  APP_BASE_URL
  APP_BASE_PATH
  APP_DOMAIN
  APP_TIME_ZONE
  DATABASE_PATH
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  SESSION_SECRET
  LETSENCRYPT_EMAIL
)

for key in "${required_vars[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required environment variable: $key" >&2
    exit 1
  fi
done

mkdir -p \
  "${RF_DATA_DIR:-$ROOT_DIR/data}" \
  "${RF_CADDY_DATA_DIR:-$ROOT_DIR/caddy_data}" \
  "${RF_CADDY_CONFIG_DIR:-$ROOT_DIR/caddy_config}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config >/dev/null
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

HEALTH_URL="${HEALTH_URL:-${APP_BASE_URL%/}/healthz}"
LOGIN_URL="${LOGIN_URL:-${APP_BASE_URL%/}/login}"

sleep 5

if command -v curl >/dev/null 2>&1; then
  curl -fsS "$HEALTH_URL" >/dev/null
  curl -fsSI "$LOGIN_URL" >/dev/null
elif command -v wget >/dev/null 2>&1; then
  wget -qO- "$HEALTH_URL" >/dev/null
  wget --spider -q "$LOGIN_URL"
else
  echo "Neither curl nor wget is available for verification." >&2
  exit 1
fi

echo "Deployment completed successfully."
echo "Health check: $HEALTH_URL"
echo "Login page:   $LOGIN_URL"
