# Agentic Coding Tools

React + Vite のフロントエンドと、Express + SQLite の API サーバーで構成された小規模 Web アプリです。  
AWS 上の単一サーバーへ Docker Compose で載せる前提で、デプロイしやすい構成に整理しています。

## ディレクトリ構成

- `client/`: Vite + React の SPA
- `server/`: Express API と SQLite 初期化処理
- `docker-compose.yml`: 本番想定の 2 コンテナ構成
- `docs/openclaw-handoff.md`: OpenClaw 向け引継ぎ資料

## ローカル開発

### 1. API サーバー

```bash
cd server
npm install
npm run dev
```

### 2. フロントエンド

```bash
cd client
npm install
npm run dev
```

Vite 側で `/api` を `http://localhost:3001` にプロキシするため、フロントコード内で `localhost:3001` を直接意識する必要はありません。

## Docker 起動

```bash
cp .env.example .env
docker compose up --build -d
```

- Web: `http://localhost/`
- API healthcheck: `http://localhost:3001/api/health`

`server` コンテナの SQLite は Docker volume `sqlite_data` に保存されます。

## 補足

- 本番ではフロントコンテナの Nginx が `/api` を `server:3001` にリバースプロキシします。
- HTTPS 終端やドメイン設定は、AWS 側では ALB / Nginx / Caddy などの追加構成で対応してください。
- 引継ぎ時の確認事項と運用メモは `docs/openclaw-handoff.md` にまとめています。
