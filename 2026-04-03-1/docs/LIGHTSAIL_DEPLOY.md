# Lightsail deployment guide

This document describes the production deployment for Research Flow on AWS Lightsail.

## Target

- Domain: `appkenya.com`
- App path: `/research-flow`
- Public app URL: `https://appkenya.com/research-flow`
- Health check: `https://appkenya.com/research-flow/healthz`
- Login page: `https://appkenya.com/research-flow/login`
- Google callback: `https://appkenya.com/research-flow/auth/google/callback`

## Server layout

Create this directory structure on the Lightsail instance:

```text
/srv/research-flow/
|- app/
|- data/
|- caddy_data/
`- caddy_config/
```

The repository lives in `/srv/research-flow/app`.

## Server prerequisites

Install these packages on the server:

- Docker Engine
- Docker Compose plugin
- `git`
- `curl`

## Environment file

Create `/srv/research-flow/app/.env` from `.env.example` and set at least:

```env
APP_BASE_URL=https://appkenya.com/research-flow
APP_BASE_PATH=/research-flow
APP_DOMAIN=appkenya.com
APP_TIME_ZONE=Asia/Tokyo
DATABASE_PATH=/app/data/research-flow.db
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
LETSENCRYPT_EMAIL=...
RF_DATA_DIR=/srv/research-flow/data
RF_CADDY_DATA_DIR=/srv/research-flow/caddy_data
RF_CADDY_CONFIG_DIR=/srv/research-flow/caddy_config
```

## Google OAuth checklist

In Google Cloud Console:

1. Create or update the OAuth consent screen.
2. Create a web application client.
3. Register these redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `http://localhost:3000/research-flow/auth/google/callback`
   - `https://appkenya.com/research-flow/auth/google/callback`
4. Add `appkenya.com` to authorized domains.

## Initial deploy

From `/srv/research-flow/app`:

```bash
git pull
./scripts/lightsail-deploy.sh
```

The deploy script validates `.env`, checks `docker compose config`, starts the stack, and verifies the health check URL.

## Existing appkenya.com site

The repository `Caddyfile` only handles `/research-flow*`. Every other path returns `404` by default.

If `appkenya.com` already serves another site, edit the fallback `handle` block in `Caddyfile` to proxy to that existing upstream before deploying.

Example:

```caddy
handle {
  reverse_proxy existing-main-site:8080
}
```

## Update flow

Use the same command every time:

```bash
git pull
./scripts/lightsail-deploy.sh
```

Then verify:

```bash
curl -fsS https://appkenya.com/research-flow/healthz
curl -I https://appkenya.com/research-flow/login
```

## Backup

Create a timestamped SQLite backup:

```bash
./scripts/lightsail-backup.sh
```

## Restore

Restore a previous backup:

```bash
./scripts/lightsail-restore.sh /srv/research-flow/data/research-flow-YYYYMMDD-HHMMSS.db
```

## Failure checks

If deployment fails, inspect in this order:

1. `docker compose -f docker-compose.prod.yml --env-file .env config`
2. `docker compose -f docker-compose.prod.yml --env-file .env ps`
3. `docker compose -f docker-compose.prod.yml --env-file .env logs app --tail=200`
4. `docker compose -f docker-compose.prod.yml --env-file .env logs caddy --tail=200`
5. `curl -fsS https://appkenya.com/research-flow/healthz`
6. Google OAuth redirect URI and `.env` values
