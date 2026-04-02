# My Spotify

自分で用意した音楽ファイルをアップロード・管理・再生できる、セルフホスト型の音楽再生Webアプリケーション。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + TypeScript + Vite |
| バックエンド | Express + TypeScript |
| データベース | SQLite (better-sqlite3) |
| インフラ | Docker Compose / AWS Lightsail |

## ディレクトリ構成

```
├── client/                  # フロントエンド（React + Vite）
│   └── src/
│       ├── components/      # Header, Sidebar, PlayerBar, TrackList, FullscreenPlayer
│       ├── contexts/        # AuthContext（認証）, PlayerContext（再生状態）
│       ├── pages/           # Home, Search, Playlist, Library, Login
│       └── lib/             # APIクライアント, ユーティリティ
├── server/                  # バックエンド（Express）
│   └── src/
│       ├── db.ts            # SQLite初期化・マイグレーション
│       ├── index.ts         # Expressエントリーポイント
│       └── routes/          # auth, tracks, playlists, search, favorites, history, artists, upload
├── uploads/                 # アップロードされた音楽・カバーアート（永続化ボリューム）
├── data/                    # SQLiteデータベースファイル（永続化ボリューム）
├── Dockerfile               # マルチステージビルド（本番用）
└── docker-compose.yml       # Lightsailデプロイ用構成
```

## 画面構成

| 画面 | パス | 概要 |
|------|------|------|
| ログイン | `/`（未認証時） | ユーザー名を入力してログイン（自動登録） |
| ホーム | `/` | 最近再生した曲、プレイリスト一覧、全曲一覧 |
| 検索 | `/search` | 曲名・アーティスト・アルバムでリアルタイム検索 |
| プレイリスト詳細 | `/playlist/:id` | 曲一覧、全曲再生、シャッフル、編集・削除 |
| ライブラリ | `/library` | 曲アップロード、プレイリスト管理、お気に入り一覧 |

全画面共通で、フッターに再生バー（再生/一時停止・シーク・音量・シャッフル・リピート）を表示。クリックでフルスクリーンプレーヤーに展開可能。

## 主な機能

- **曲のアップロード**: MP3/WAV/FLAC/OGG/M4A/AAC対応（最大50MB）。ドラッグ＆ドロップ可。メタデータ（タイトル・アーティスト・アルバム・カバーアート）を自動抽出
- **曲情報の手動編集**: アップロード後にタイトル・アーティスト・アルバムを変更可能
- **プレイリスト**: 作成・編集・削除。任意の曲をプレイリストに追加・削除
- **お気に入り**: 曲単位でお気に入り登録
- **検索**: デバウンス付きリアルタイム検索。曲/プレイリストのフィルター切り替え
- **再生**: HTML5 Audio API。シャッフル・リピート（全曲/1曲）・音量（localStorage永続化）
- **認証**: ユーザー名のみ（パスワードなし）。ヘッダーに`X-User-Id`を付与するシンプルな方式

## API一覧

| メソッド | パス | 概要 |
|---------|------|------|
| POST | `/api/auth/login` | ログイン（ユーザー自動作成） |
| GET | `/api/auth/me` | 現在のユーザー情報取得 |
| GET | `/api/tracks` | 全曲一覧（`?limit=&offset=`） |
| GET | `/api/tracks/:id` | 曲詳細 |
| PUT | `/api/tracks/:id` | 曲情報更新（title, artist_name, album_title） |
| DELETE | `/api/tracks/:id` | 曲削除 |
| GET | `/api/playlists` | プレイリスト一覧 |
| GET | `/api/playlists/:id` | プレイリスト詳細（曲一覧含む） |
| POST | `/api/playlists` | プレイリスト作成 |
| PUT | `/api/playlists/:id` | プレイリスト更新 |
| DELETE | `/api/playlists/:id` | プレイリスト削除 |
| POST | `/api/playlists/:id/tracks` | プレイリストに曲追加 |
| DELETE | `/api/playlists/:id/tracks/:trackId` | プレイリストから曲削除 |
| GET | `/api/search?q=` | 検索（曲・プレイリスト） |
| GET | `/api/favorites` | お気に入り一覧 |
| POST | `/api/favorites` | お気に入り追加 |
| DELETE | `/api/favorites/:trackId` | お気に入り解除 |
| GET | `/api/favorites/check/:trackId` | お気に入り状態確認 |
| GET | `/api/history` | 再生履歴（`?limit=`） |
| POST | `/api/history` | 再生記録 |
| GET | `/api/artists` | アーティスト一覧 |
| GET | `/api/artists/:id` | アーティスト詳細（曲・アルバム含む） |
| POST | `/api/upload` | 曲ファイルアップロード（multipart/form-data） |

## DB設計

```
users         1──N playlists
users         1──N favorites
users         1──N play_history
artists       1──N albums
artists       1──N tracks
albums        1──N tracks
playlists     N──M tracks  (through playlist_tracks)
tracks        1──N favorites
tracks        1──N play_history
```

テーブル: `users`, `artists`, `albums`, `tracks`, `playlists`, `playlist_tracks`, `favorites`, `play_history`

## ローカル開発

```bash
# 依存関係インストール
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 開発サーバー起動（フロント: 5173 / バック: 3001）
npm run dev
```

フロントエンドは Vite のプロキシ設定により `/api/*` と `/uploads/*` をバックエンドに転送する。

## デプロイ（AWS Lightsail）

### 前提

- Lightsailインスタンス（Ubuntu推奨）にDocker / Docker Composeがインストール済み
- セキュリティグループでポート80が開放済み

### 手順

```bash
# 1. リポジトリをサーバーに配置
git clone <repository-url> /opt/my-spotify
cd /opt/my-spotify

# 2. ビルド＆起動
docker compose up -d --build

# 3. 状態確認
docker compose ps
docker compose logs -f
```

- アプリはポート80で公開される（`docker-compose.yml` で `80:3001` にマッピング）
- `uploads` と `data` はDockerの名前付きボリュームで永続化される
- ログはjson-fileドライバでローテーション（最大10MB × 3ファイル）

### 更新

```bash
cd /opt/my-spotify
git pull
docker compose up -d --build
```

### バックアップ

```bash
# SQLiteデータベースのバックアップ
docker compose exec app sh -c "cp /app/data/myspotify.db /app/data/myspotify.db.bak"

# uploadsボリュームのバックアップ
docker run --rm -v my-spotify_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

## デザイン方針

- Notion風のライトテーマ（柔らかい配色、余白多め）
- フォント: Inter + Noto Sans JP
- レイアウト: ヘッダー + サイドバー + メインコンテンツ + フッター再生バー
