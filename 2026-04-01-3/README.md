# Studio Notes

Notion 風のページ管理 UI を持つ、フロントエンド・バックエンド分離型のメモアプリです。  
現状は React + Vite + TypeScript のフロントエンド、Fastify + SQLite のバックエンドで構成されています。

## OpenClaw Agent Notes

この `README.md` を OpenClaw エージェント向けの運用ドキュメントとして扱ってください。  
macOS の既定ファイルシステムでは `README.md` と `readme.md` を別ファイルとして共存させにくいため、本プロジェクトでは `README.md` を正本に統一します。

- アプリ名: `Studio Notes`
- フロントエンド: `frontend/`
- バックエンド: `backend/`
- SQLite 実データ: `backend/data/studio-notes.sqlite`
- 本番想定: Docker + Lightsail
- 本番公開ポート: `80`
- コンテナ間通信:
  - `frontend` が `nginx` で静的配信
  - `/api/*` を `backend:3001` へリバースプロキシ

OpenClaw エージェントが変更するときの基本方針:

- フロントの API ベース URL は原則 [frontend/src/api.ts](/Users/kenya/Desktop/2026-04-01/frontend/src/api.ts) の既定値 `/api` を維持する
- ローカル開発では `VITE_API_URL` に `http://localhost:3001` などを渡して上書きする
- 本番 Docker では [frontend/nginx.conf](/Users/kenya/Desktop/2026-04-01/frontend/nginx.conf) の `/api/` プロキシを前提にする
- SQLite はコンテナ内に閉じ込めず、[docker-compose.yml](/Users/kenya/Desktop/2026-04-01/docker-compose.yml) の named volume で永続化する
- `backend/data/` の実 DB を Git 管理しない運用が望ましい
- デプロイ前は少なくとも `frontend` と `backend` のビルドを通す

## Current Features

- サイドバーでフォルダー/ファイルを管理
- ファイル名の自動採番 `YYYY-MM-DD-n`
- パンくず表示
- プレーンテキストブロック編集
- コードブロック編集
- コードブロックのシンタックスハイライト
- コードブロックの並び替え
- 自動保存
- SQLite 永続化

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

既定ポートは `3001` です。別ポートで起動する場合:

```bash
cd backend
PORT=3002 npm run dev
```

### Frontend

```bash
cd frontend
npm install
VITE_API_URL=http://127.0.0.1:3001 npm run dev -- --host 127.0.0.1
```

バックエンドを `3002` で起動した場合:

```bash
cd frontend
VITE_API_URL=http://127.0.0.1:3002 npm run dev -- --host 127.0.0.1
```

## Build Checks

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Docker

本番向け Docker 構成:

- [docker-compose.yml](/Users/kenya/Desktop/2026-04-01/docker-compose.yml)
- [frontend/Dockerfile](/Users/kenya/Desktop/2026-04-01/frontend/Dockerfile)
- [backend/Dockerfile](/Users/kenya/Desktop/2026-04-01/backend/Dockerfile)
- [frontend/nginx.conf](/Users/kenya/Desktop/2026-04-01/frontend/nginx.conf)
- [frontend/.dockerignore](/Users/kenya/Desktop/2026-04-01/frontend/.dockerignore)
- [backend/.dockerignore](/Users/kenya/Desktop/2026-04-01/backend/.dockerignore)

### 起動

```bash
docker compose up --build -d
```

公開 URL:

- アプリ: `http://<server-ip>/`
- API ヘルスチェック: `http://<server-ip>/api/health`

### 停止

```bash
docker compose down
```

### DB を残したまま再作成

```bash
docker compose down
docker compose up --build -d
```

`studio_notes_data` ボリュームに SQLite データが残るため、通常の再デプロイでノートは消えません。

## Lightsail Deployment

Lightsail では Ubuntu 系インスタンスに Docker を入れて、このリポジトリを配置し、`docker compose` で起動する構成を想定しています。

### 想定手順

```bash
git clone <repo>
cd 2026-04-01
docker compose up --build -d
```

Lightsail 側のネットワーク設定:

- `80/tcp` を開放
- 必要なら `443/tcp` を開放して将来的に HTTPS 終端を追加
- `3001` や `3002` は外部公開不要

### デプロイ後確認

```bash
curl http://127.0.0.1/api/health
docker compose ps
docker compose logs --tail=100
```

補足:

- フロントコンテナだけを公開し、API は内部ネットワークで閉じる構成です
- `frontend` はビルド時に `VITE_API_URL=/api` を埋め込むため、同一オリジン運用になります

## Important Paths

- フロントエンド API クライアント: [frontend/src/api.ts](/Users/kenya/Desktop/2026-04-01/frontend/src/api.ts)
- フロントエンドメイン画面: [frontend/src/App.tsx](/Users/kenya/Desktop/2026-04-01/frontend/src/App.tsx)
- バックエンドエントリ: [backend/src/server.ts](/Users/kenya/Desktop/2026-04-01/backend/src/server.ts)
- SQLite アクセス層: [backend/src/db.ts](/Users/kenya/Desktop/2026-04-01/backend/src/db.ts)

## Known Operational Notes

- `backend/data/` にローカルの SQLite ファイルが置かれる
- 既存の `3001` ポートが他プロセスに使われている環境では、開発時に `PORT=3002` などへ変更する
- Vite 開発サーバーは `VITE_API_URL` を指定しないと `/api` を見に行くため、バックエンド直結開発では明示設定が必要

## Suggested Next Improvements

- Lightsail Container Service 用の単独イメージ構成やデプロイスクリプトを追加
- HTTPS 終端に Caddy または Nginx reverse proxy を追加
- SQLite バックアップスクリプトを追加
- 初期データ投入や DB マイグレーションの仕組みを追加
