# Prompt Forge

Claude Codeに渡すプロンプトを、フォーム形式で組み立てて出力するWebアプリ。  
各項目を「選択肢＋自由記述」で埋めると、Markdown形式のプロンプトがリアルタイムに生成され、ワンクリックでコピーできる。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + Vite 8 + TypeScript |
| バックエンド | Express 5 (TypeScript) |
| データベース | SQLite (better-sqlite3) |
| スタイリング | Tailwind CSS v4 |
| デプロイ | Docker → AWS Lightsail |

## ディレクトリ構成

```
prompt-forge/
├── client/                 # React フロントエンド
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   │   ├── form/       # フォーム部品 + 8セクション
│   │   │   ├── layout/     # Header
│   │   │   ├── preview/    # Markdownプレビュー + コピー
│   │   │   └── templates/  # 保存/読み込みダイアログ
│   │   ├── hooks/          # useFormState, useTemplates, useMarkdownGenerator
│   │   ├── lib/            # markdownBuilder, api, constants
│   │   └── types/          # TypeScript型定義
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Express バックエンド
│   ├── src/
│   │   ├── index.ts        # エントリーポイント（静的ファイル配信 + API）
│   │   ├── db.ts           # SQLite初期化・スキーマ
│   │   └── routes/
│   │       └── templates.ts # テンプレートCRUD API
│   ├── tsconfig.json
│   └── package.json
├── Dockerfile              # マルチステージビルド
├── docker-compose.yml      # Lightsail運用向け
├── nginx.conf              # リバースプロキシ設定例
├── package.json            # npm workspaces ルート
└── tsconfig.base.json
```

## 機能

### タブ切り替え（簡易版 / 詳細版）

**簡易版**（Plan mode前提の最小限プロンプト生成）:
1. アプリ概要・目的 — アプリ名、一言説明、目的・ゴール
2. 画面構成 — レイアウトパターン、画面一覧（動的追加）
3. 技術スタック — FE / BE / DB / 言語の選択
4. デザインテイスト — ベーステイスト、カラーテーマ、補足
5. 認証・API連携 — 認証方式（複数選択）、外部API（動的追加）

**詳細版**（簡易版の全項目 + 以下を追加）:
6. ER図・DB設計 — テーブル名、カラム定義、リレーション
7. ページ別ワイヤーフレーム — 画面一覧と自動連動、コンポーネント/操作フロー/状態管理
8. CI/CD・Docker構成 — コンテナ構成、デプロイ先、CI/CDツール

### その他の機能
- **リアルタイムMarkdownプレビュー** — フォーム入力と同時に右カラムで確認
- **ワンクリックコピー** — 生成されたMarkdown全文をクリップボードにコピー
- **テンプレート保存/読み込み** — SQLiteに永続化、上書き保存・名前を付けて保存・削除に対応
- **レスポンシブ** — デスクトップ2カラム / モバイル1カラム
- **日本語UI** — 全てのラベル・プレースホルダー・ボタンが日本語

## APIエンドポイント

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/templates` | テンプレート一覧取得 |
| GET | `/api/templates/:id` | テンプレート詳細取得 |
| POST | `/api/templates` | テンプレート新規保存 |
| PUT | `/api/templates/:id` | テンプレート上書き保存 |
| DELETE | `/api/templates/:id` | テンプレート削除 |

## DBスキーマ

```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  tab_type TEXT NOT NULL CHECK(tab_type IN ('simple', 'detailed')),
  form_data TEXT NOT NULL,        -- フォーム全入力値のJSON
  generated_prompt TEXT NOT NULL,  -- 生成済みMarkdown
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## ローカル開発

```bash
# 依存インストール
npm install

# 開発サーバー起動（フロント:5173 + バック:3001）
npm run dev
```

- フロントエンド: http://localhost:5173 （Vite dev server、APIは3001にproxy）
- バックエンド: http://localhost:3001

## ビルド

```bash
npm run build
npm start
```

## Dockerでの起動

```bash
# ビルド＆起動
docker compose up -d --build

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

コンテナはポート `3001` で待ち受け、SQLiteデータは `app-data` ボリュームに永続化される。

## AWS Lightsailへのデプロイ手順

### 1. Lightsailインスタンス準備

```bash
# Docker + Docker Compose のインストール（Ubuntu）
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. リポジトリをクローンしてビルド

```bash
git clone <repository-url> prompt-forge
cd prompt-forge
docker compose up -d --build
```

### 3. Nginx リバースプロキシ設定

```bash
sudo apt install -y nginx
sudo cp nginx.conf /etc/nginx/sites-available/prompt-forge
sudo ln -s /etc/nginx/sites-available/prompt-forge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. SSL証明書（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d prompt.appkenya.com
```

### 5. ファイアウォール

Lightsailのネットワーキング設定で以下のポートを開放:
- **80** (HTTP → HTTPSリダイレクト)
- **443** (HTTPS)

ポート3001は外部に公開不要（nginxが内部で接続）。

## 環境変数

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `PORT` | `3001` | サーバー待ち受けポート |
| `DB_PATH` | `./data/prompt-forge.db` | SQLiteファイルパス |
| `NODE_ENV` | - | `production` でCORS等の挙動が変わる |
