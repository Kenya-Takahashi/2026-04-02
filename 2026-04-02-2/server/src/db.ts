import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const configuredDbPath = process.env.DB_PATH;
const dbPath = configuredDbPath
  ? (path.isAbsolute(configuredDbPath)
      ? configuredDbPath
      : path.resolve(__dirname, '..', configuredDbPath))
  : path.resolve(__dirname, '../db.sqlite');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

export const initDb = () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      try {
        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create tools table
        db.run(`
          CREATE TABLE IF NOT EXISTS tools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            official_url TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create characters table
        db.run(`
          CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tool_id INTEGER NOT NULL UNIQUE REFERENCES tools(id),
            name TEXT NOT NULL,
            animal_type TEXT NOT NULL,
            color_accent TEXT NOT NULL,
            image_path TEXT NOT NULL,
            image_prompt TEXT NOT NULL,
            personality TEXT
          )
        `);

        // Create favorites table
        db.run(`
          CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            tool_id INTEGER NOT NULL REFERENCES tools(id),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, tool_id)
          )
        `);

        // Seed data
        db.get('SELECT count(*) as count FROM tools', (err, row: any) => {
          if (err) return reject(err);
          if (row.count === 0) {
            console.log('Seeding initial data...');
            const tools = [
              { slug: 'claude-code', name: 'Claude Code', description: 'Anthropicが提供するエージェンティックなコーディングシステム。CLI上で自律的にコードを生成、ファイル編集、テスト実行を行い、チームメイトのように開発を支援します。', category: 'agent' },
              { slug: 'openclaw', name: 'OpenClaw', description: '任意のLLMを利用できるローカル・オープンソースな自律型AIアシスタント。各種スキルで機能を拡張でき、実世界の「JARVIS」として自動化を担います。', category: 'agent' },
              { slug: 'docker', name: 'Docker', description: 'コンテナ型の仮想環境技術。Agentic Codingにおいては、AIがシステムを破壊しないように安全に隔離するための「サンドボックス」として重宝されます。', category: 'infrastructure' },
              { slug: 'ubuntu', name: 'Ubuntu', description: 'Agentic Codingにおける事実上の標準デプロイ・開発環境。AIエージェントがコマンドを実行するインフラとしてもっとも実績のあるLinux環境です。', category: 'os' },
              { slug: 'linux', name: 'Linux', description: 'あらゆるシステムの根本となるOSカーネル。エージェントが自律的にトラブルシュートやシステム構築を行うために必須となるOS基盤です。', category: 'os' },
              { slug: 'codex', name: 'Codex', description: 'OpenAI製クラウドネイティブAIコーディングエージェント。俯瞰的な視点から複数ファイルにまたがるコードの構築やプルリクエストのレビューを自動化します。', category: 'cloud' },
              { slug: 'antigravity', name: 'Antigravity', description: '画像生成AIなどのマルチモーダル能力を内包した次世代Agenticツール。コード実装のみならずリソース作成まで行い、従来の常識にとらわれない開発を可能にします。', category: 'agent' }
            ];

            const stmtTool = db.prepare('INSERT INTO tools (name, slug, description, category) VALUES (?, ?, ?, ?)');
            tools.forEach(t => stmtTool.run([t.name, t.slug, t.description, t.category]));
            stmtTool.finalize((err) => {
              if (err) return reject(err);

              const characters = [
                { slug: 'claude-code', name: 'Claude Code', animal_type: 'フクロウ', color_accent: 'amber', image_path: '/images/claude_code.png', image_prompt: 'Minimal Notion-style flat illustration, a cute robot owl mascot ...' },
                { slug: 'openclaw', name: 'OpenClaw', animal_type: 'ネコ', color_accent: 'slate', image_path: '/images/openclaw.png', image_prompt: '...' },
                { slug: 'docker', name: 'Docker', animal_type: 'クジラ', color_accent: 'blue', image_path: '/images/docker.png', image_prompt: '...' },
                { slug: 'ubuntu', name: 'Ubuntu', animal_type: 'ミーアキャット', color_accent: 'orange', image_path: '/images/ubuntu.png', image_prompt: '...' },
                { slug: 'linux', name: 'Linux', animal_type: 'ペンギン', color_accent: 'gray', image_path: '/images/linux.png', image_prompt: '...' },
                { slug: 'codex', name: 'Codex', animal_type: 'タカ', color_accent: 'green', image_path: '/images/codex.png', image_prompt: '...' },
                { slug: 'antigravity', name: 'Antigravity', animal_type: 'チョウ', color_accent: 'purple', image_path: '/images/antigravity.png', image_prompt: '...' }
              ];

              const stmtChar = db.prepare('INSERT INTO characters (tool_id, name, animal_type, color_accent, image_path, image_prompt) SELECT id, ?, ?, ?, ?, ? FROM tools WHERE slug = ?');
              characters.forEach(c => stmtChar.run([c.name, c.animal_type, c.color_accent, c.image_path, c.image_prompt, c.slug]));
              stmtChar.finalize();
              resolve();
            });
          } else {
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};

export default db;
