# Agent Coding Session

LT（ライトニングトーク）用の Web アプリケーション。
Agent Coding（AI と協働する開発手法）の実践プロセスを、スライドと 4 つのインタラクティブデモで紹介する。

## 技術スタック

- Node.js + Express
- SQLite（better-sqlite3）
- Chart.js（CDN）
- Vanilla JS（ビルドステップなし）

## ページ構成

| パス | 内容 |
|------|------|
| `/` | トップページ（ハブ） |
| `/slides` | スライド 6 枚（← → キー対応） |
| `/demo/crud` | メモの CRUD 操作デモ |
| `/demo/filter` | 商品の検索・絞り込みデモ |
| `/demo/chart` | 月別売上データのグラフ描画デモ |
| `/demo/realtime` | サーバー稼働情報のリアルタイム表示デモ |

## ローカル開発

```bash
npm install
npm run dev
# http://localhost:3456
```

初回起動時に `data.db` が自動生成され、シードデータが投入される。
DB をリセットしたい場合は `data.db*` を削除して再起動する。

## Docker

```bash
docker build -t agent-coding-session .
docker run -p 3456:3456 agent-coding-session
```

## AWS Lightsail へのデプロイ

### コンテナサービスの場合

1. コンテナイメージをビルド・プッシュ:
   ```bash
   aws lightsail create-container-service \
     --service-name agent-coding \
     --power nano \
     --scale 1

   aws lightsail push-container-image \
     --service-name agent-coding \
     --label app \
     --image agent-coding-session
   ```

2. デプロイ設定を作成（`lightsail-deploy.json`）:
   ```json
   {
     "containers": {
       "app": {
         "image": ":agent-coding.app.latest",
         "ports": { "3456": "HTTP" }
       }
     },
     "publicEndpoint": {
       "containerName": "app",
       "containerPort": 3456
     }
   }
   ```

3. デプロイ:
   ```bash
   aws lightsail create-container-service-deployment \
     --service-name agent-coding \
     --cli-input-json file://lightsail-deploy.json
   ```

### インスタンスの場合

1. Ubuntu インスタンスを作成
2. SSH 接続後:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER

   git clone <repo-url> app && cd app
   docker build -t agent-coding-session .
   docker run -d --restart unless-stopped -p 80:3456 agent-coding-session
   ```

## API 一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/slides` | スライド一覧 |
| GET | `/api/memos` | メモ一覧 |
| POST | `/api/memos` | メモ作成 |
| PUT | `/api/memos/:id` | メモ更新 |
| DELETE | `/api/memos/:id` | メモ削除 |
| GET | `/api/products?category=&price_max=&q=` | 商品検索 |
| GET | `/api/sales?category=` | 売上データ |
| GET | `/api/server/status` | サーバー稼働情報 |
| GET | `/api/server/requests` | リクエスト統計 |

## ファイル構成

```
server.js          Express アプリ・全ルート・HTML テンプレート
db.js              SQLite スキーマ定義・シードデータ
public/
  style.css        Notion ライトモード風 CSS
  slides.js        スライドナビゲーション
  demo-common.js   3 ステップ可視化・速度制御（共通）
  demo-crud.js     CRUD デモ
  demo-filter.js   フィルタリングデモ
  demo-chart.js    グラフデモ
  demo-realtime.js リアルタイムデモ
Dockerfile         コンテナビルド設定
.dockerignore      Docker 除外ファイル
```

## 注意事項

- SQLite のデータはコンテナ内に保存されるため、コンテナ再作成でリセットされる（デモ用途なので問題なし）
- ポートは `3456` を使用（`server.js` 内で設定）
- デモ用アプリのため、認証・HTTPS 等のセキュリティ対策は含まない
