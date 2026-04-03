# OpenClaw handoff prompt

Use this prompt inside OpenClaw on the AWS Lightsail machine.

---

You are on the Lightsail production server for Research Flow.

Goal:
- Deploy the latest version of Research Flow with Docker Compose.
- Serve it at `https://appkenya.com/research-flow`.
- Keep SQLite data persistent.
- Verify login and health check behavior after deploy.

Repository:
- Path: `/srv/research-flow/app`

Expected host directories:
- `/srv/research-flow/data`
- `/srv/research-flow/caddy_data`
- `/srv/research-flow/caddy_config`

Environment file:
- `/srv/research-flow/app/.env`

Required environment values:
- `APP_BASE_URL=https://appkenya.com/research-flow`
- `APP_BASE_PATH=/research-flow`
- `APP_DOMAIN=appkenya.com`
- `APP_TIME_ZONE=Asia/Tokyo`
- `DATABASE_PATH=/app/data/research-flow.db`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `LETSENCRYPT_EMAIL`
- `RF_DATA_DIR=/srv/research-flow/data`
- `RF_CADDY_DATA_DIR=/srv/research-flow/caddy_data`
- `RF_CADDY_CONFIG_DIR=/srv/research-flow/caddy_config`

Before you start:
1. Confirm Docker Engine is installed.
2. Confirm Docker Compose plugin is installed.
3. Confirm `/srv/research-flow/app/.env` exists.
4. Confirm DNS for `appkenya.com` points to this server.
5. Confirm Google OAuth callback includes `https://appkenya.com/research-flow/auth/google/callback`.
6. If `appkenya.com` already serves another site, inspect `Caddyfile` and replace the fallback `handle` block with the correct main-site upstream before deploying.

Commands to run:

```bash
cd /srv/research-flow/app
git pull
./scripts/lightsail-deploy.sh
```

Success conditions:
1. `docker compose -f docker-compose.prod.yml --env-file .env config` succeeds.
2. `docker compose -f docker-compose.prod.yml --env-file .env ps` shows `app` and `caddy` running.
3. `https://appkenya.com/research-flow/healthz` returns `200`.
4. `https://appkenya.com/research-flow/login` loads.
5. The Google OAuth start URL uses `/research-flow/auth/google/callback`.

If deployment fails, collect:
```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env logs app --tail=200
docker compose -f docker-compose.prod.yml --env-file .env logs caddy --tail=200
```

Do not change application code on the server unless deployment is blocked by a server-only configuration issue. Prefer fixing `.env`, DNS, or Caddy routing before touching the app.
