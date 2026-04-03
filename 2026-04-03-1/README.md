# Research Flow

Research Flow is a research workflow app that combines Inbox, Projects, Daily Focus, Notes, Sprint, and Review into one workspace.

This repository is prepared for production deployment on AWS Lightsail with Docker Compose, Caddy, SQLite, Google OAuth, and subpath hosting at [https://appkenya.com/research-flow](https://appkenya.com/research-flow).

## Production target

- Public app URL: `https://appkenya.com/research-flow`
- Login URL: `https://appkenya.com/research-flow/login`
- Health check URL: `https://appkenya.com/research-flow/healthz`
- Google OAuth callback URL: `https://appkenya.com/research-flow/auth/google/callback`

## Local development

```bash
npm ci
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test the production subpath shape locally, set these values in `.env` first:

```env
APP_BASE_URL=http://localhost:3000/research-flow
APP_BASE_PATH=/research-flow
```

Then start the dev server and open:

- [http://localhost:3000/research-flow/login](http://localhost:3000/research-flow/login)
- [http://localhost:3000/research-flow/healthz](http://localhost:3000/research-flow/healthz)

## Required environment variables

Copy `.env.example` to `.env` and set these values for production:

- `APP_BASE_URL=https://appkenya.com/research-flow`
- `APP_BASE_PATH=/research-flow`
- `APP_DOMAIN=appkenya.com`
- `APP_TIME_ZONE=Asia/Tokyo`
- `DATABASE_PATH=/app/data/research-flow.db`
- `GOOGLE_CLIENT_ID=<google oauth client id>`
- `GOOGLE_CLIENT_SECRET=<google oauth client secret>`
- `SESSION_SECRET=<long random secret>`
- `LETSENCRYPT_EMAIL=<email for tls notices>`
- `RF_DATA_DIR=/srv/research-flow/data`
- `RF_CADDY_DATA_DIR=/srv/research-flow/caddy_data`
- `RF_CADDY_CONFIG_DIR=/srv/research-flow/caddy_config`

## Google OAuth setup

Create a Google OAuth web application in Google Cloud Console and register these redirect URIs:

- `http://localhost:3000/auth/google/callback`
- `http://localhost:3000/research-flow/auth/google/callback`
- `https://appkenya.com/research-flow/auth/google/callback`

Also add `appkenya.com` to the OAuth consent screen authorized domains list.

After configuration:

1. Put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` into `.env`.
2. Confirm `/research-flow/healthz` returns `oauthConfigured: true`.
3. Open `/research-flow/login` and verify Google login starts correctly.

## Docker production deployment

The production stack is:

- `app`: Next.js standalone server with SQLite at `/app/data/research-flow.db`
- `caddy`: TLS termination and reverse proxy for `/research-flow*`

Validate config:

```bash
docker compose -f docker-compose.prod.yml --env-file .env config
```

Start or update the stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

The compose file passes `APP_BASE_URL` and `APP_BASE_PATH` into the image build, which is required because Next.js `basePath` is compiled at build time.

## AWS Lightsail deployment flow

Recommended server layout:

```text
/srv/research-flow/
|- app/           # this repository
|- data/          # sqlite database
|- caddy_data/    # caddy certificates
`- caddy_config/  # caddy runtime config
```

Recommended first deploy:

1. Provision an Ubuntu Lightsail instance.
2. Install Docker Engine, Docker Compose plugin, `git`, and `curl`.
3. Create `/srv/research-flow` and clone this repo into `/srv/research-flow/app`.
4. Copy `.env.example` to `/srv/research-flow/app/.env`.
5. Set production values in `.env`.
6. Ensure DNS for `appkenya.com` points at the Lightsail instance.
7. Register the production Google OAuth callback URL.
8. From `/srv/research-flow/app`, run:

```bash
./scripts/lightsail-deploy.sh
```

9. Verify:
   - `https://appkenya.com/research-flow/healthz`
   - `https://appkenya.com/research-flow/login`

## Existing appkenya.com site coexistence

The included `Caddyfile` routes `/research-flow*` to Research Flow and returns `404` for every other path by default.

If `appkenya.com` already serves another site, replace the fallback `handle` block in `Caddyfile` with a reverse proxy to the existing upstream. Example:

```caddy
handle {
  reverse_proxy existing-main-site:8080
}
```

Keep the `/research-flow*` block above it unchanged.

## Update procedure

From the repository directory on Lightsail:

```bash
git pull
./scripts/lightsail-deploy.sh
```

Verify after every update:

- `https://appkenya.com/research-flow/healthz` returns `200`
- `oauthConfigured` is `true`
- `https://appkenya.com/research-flow/login` opens correctly

## Backup and restore

Create a backup:

```bash
./scripts/lightsail-backup.sh
```

Restore from a backup file:

```bash
./scripts/lightsail-restore.sh /srv/research-flow/data/research-flow-YYYYMMDD-HHMMSS.db
```

## OpenClaw handoff

Use these documents when handing work off to OpenClaw on the Lightsail machine:

- [Lightsail deployment guide](./docs/LIGHTSAIL_DEPLOY.md)
- [OpenClaw handoff prompt](./docs/OPENCLAW_HANDOFF.md)

The handoff document is written so OpenClaw can execute the deployment in order without making extra decisions.
