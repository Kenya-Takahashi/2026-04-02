# 卒論ゼミノート

卒論ゼミで4年生の発表を聞きながら、メモ取り・研究要素評価・コメント構築を支援するWebアプリ。

## 機能概要

- **セッション管理**: ゼミ回ごとにセッションを作成し、複数の発表を管理
- **メモ**: 発表ごとに自由記述のメモ欄（800msデバウンスのオートセーブ）
- **研究要素評価**: 7項目を4段階（不足/要改善/良好/優秀）で評価、不足項目を自動ハイライト
- **フィードバック**: 良い点・指摘事項・アクションプラン（優先度: 高/中/低）を記録
- **ワークフローガイド**: Claude等のLLMと連携したコメント構築手順を画面上で確認可能

### 研究要素 (7項目)

1. 研究の新規性
2. 問題設定の明確さ
3. 関連研究の調査
4. 手法の妥当性
5. 実験計画
6. 実現可能性
7. 社会的意義

### 想定ワークフロー

1. 発表を聞きながらメモを取る
2. メモをClaudeに投げて研究要素を4段階評価してもらう
3. 評価パネルに記録
4. Claudeに良い点・指摘・アクションプランを提案してもらう
5. フィードバック欄に記録

---

## 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS 3, TanStack Query 5, React Router 7 |
| Backend | Fastify 5, TypeScript |
| DB | SQLite (better-sqlite3 + Drizzle ORM) |
| 共有型定義 | `@seminar/shared` パッケージ |
| Deploy | Docker, docker-compose |

## プロジェクト構成

```
thesis-seminar-manager/
├── package.json               # npm workspaces root
├── tsconfig.base.json         # 共有TypeScript設定
├── Dockerfile                 # マルチステージビルド
├── docker-compose.yml
├── .dockerignore
├── .gitignore
│
├── packages/
│   ├── shared/                # 共有型定義・定数
│   │   └── src/
│   │       ├── types.ts       # Session, Presentation, Ratings, ActionPlan 等
│   │       ├── constants.ts   # 研究要素定義, 評価ラベル
│   │       └── index.ts
│   │
│   ├── server/                # バックエンド
│   │   └── src/
│   │       ├── index.ts       # Fastifyエントリ + 静的ファイル配信
│   │       ├── db/
│   │       │   ├── schema.ts  # Drizzle ORMスキーマ定義
│   │       │   ├── client.ts  # DB接続 (WALモード, FK有効)
│   │       │   └── migrate.ts # 起動時テーブル作成
│   │       └── routes/
│   │           ├── sessions.ts       # Session CRUD
│   │           └── presentations.ts  # Presentation CRUD + オートセーブ
│   │
│   └── client/                # フロントエンド
│       ├── index.html
│       ├── vite.config.ts     # 開発時APIプロキシ設定あり
│       ├── tailwind.config.ts
│       └── src/
│           ├── main.tsx       # React + QueryClient + Router初期化
│           ├── App.tsx        # ルーティング
│           ├── api/           # fetch wrapper, API呼び出し関数
│           ├── hooks/         # useSessions, usePresentation, useAutoSave
│           ├── components/
│           │   ├── layout/         # Sidebar
│           │   ├── session/        # NewSessionDialog
│           │   └── presentation/   # PresentationView, NotesEditor,
│           │                       # RatingPanel, FeedbackSection
│           └── pages/
│               ├── SessionPage.tsx
│               ├── EmptyState.tsx
│               └── WorkflowPage.tsx
```

## DBスキーマ

### sessions テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | INTEGER PK | 自動採番 |
| date | TEXT | ISO日付 (例: "2026-04-02") |
| title | TEXT | セッション名 (任意) |
| createdAt | TEXT | 作成日時 (ISO) |
| updatedAt | TEXT | 更新日時 (ISO) |

### presentations テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | INTEGER PK | 自動採番 |
| sessionId | INTEGER FK | → sessions.id (CASCADE DELETE) |
| studentName | TEXT | 発表者名 |
| thesisTitle | TEXT | テーマ |
| displayOrder | INTEGER | 表示順 |
| notes | TEXT | 自由記述メモ |
| ratings | TEXT (JSON) | `{"novelty": 3, "feasibility": 1, ...}` |
| goodPoints | TEXT (JSON) | `["テーマが面白い", ...]` |
| issues | TEXT (JSON) | `["先行研究が不足", ...]` |
| actionPlans | TEXT (JSON) | `[{"text": "文献調査", "priority": "高"}, ...]` |
| createdAt | TEXT | 作成日時 |
| updatedAt | TEXT | 更新日時 |

## API一覧

| Method | Path | 説明 |
|--------|------|------|
| `GET` | `/api/sessions` | セッション一覧 (日付降順) |
| `POST` | `/api/sessions` | セッション作成 `{date, title?}` |
| `GET` | `/api/sessions/:id` | セッション + 発表一覧 |
| `PATCH` | `/api/sessions/:id` | セッション更新 `{date?, title?}` |
| `DELETE` | `/api/sessions/:id` | セッション削除 (発表もCASCADE) |
| `POST` | `/api/sessions/:sid/presentations` | 発表追加 `{studentName, thesisTitle?}` |
| `PATCH` | `/api/presentations/:id` | 発表更新 (全フィールド対応) |
| `DELETE` | `/api/presentations/:id` | 発表削除 |
| `PATCH` | `/api/presentations/:id/notes` | ノートのみオートセーブ `{notes}` |
| `PATCH` | `/api/presentations/:id/ratings` | 評価のみオートセーブ `{ratings}` |

---

## ローカル開発

```bash
# 依存インストール
npm install

# サーバー起動 (localhost:3000)
cd packages/server
npx tsx src/index.ts

# 別ターミナルでフロントエンド起動 (localhost:5173)
cd packages/client
npx vite

# ブラウザで http://localhost:5173 を開く
```

開発時、Viteの設定でフロントエンドの `/api/*` リクエストは `localhost:3000` に自動プロキシされる。

## Dockerデプロイ

### ビルド & 起動

```bash
docker compose up -d --build
# → http://localhost:3000 でアクセス可能
```

### アーキテクチャ

- **1プロセス構成**: Fastifyが静的ファイル配信 + API を兼ねる
- **DBファイル**: Docker volume `db-data` に永続化 (`/data/seminar.db`)
- **ポート**: 3000 (環境変数 `PORT` で変更可能)

### 環境変数

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `PORT` | `3000` | サーバーポート |
| `HOST` | `0.0.0.0` | バインドアドレス |
| `DATABASE_PATH` | `seminar.db` (dev) / `/data/seminar.db` (Docker) | SQLiteファイルパス |

### AWS Lightsail へのデプロイ手順

1. Lightsailインスタンス作成 (Ubuntu, $3.50〜/月)
2. Docker & docker-compose インストール
3. リポジトリをclone
4. `docker compose up -d --build`
5. Lightsailのネットワーキングでポート3000を開放
6. (任意) nginx reverse proxy + Let's Encrypt でHTTPS化

### DBバックアップ

```bash
# コンテナ内のSQLiteファイルをホストにコピー
docker compose cp app:/data/seminar.db ./backup_$(date +%Y%m%d).db
```

## 既知の制約・今後の改善候補

- **認証なし**: 単一ユーザー想定。必要に応じてnginx basic authを前段に追加
- **発表の並び替え**: 現在はdisplayOrderカラムがあるがUI未実装
- **エクスポート**: セッション内容のMarkdown/PDF出力は未実装
- **モバイル対応**: 現在はPC (ノートPC) ブラウザ向けレイアウトのみ
