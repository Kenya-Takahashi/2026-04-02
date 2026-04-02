const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS slides (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS request_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// --- Seed ---
const slideCount = db.prepare('SELECT COUNT(*) AS c FROM slides').get().c;
if (slideCount === 0) {
  const insertSlide = db.prepare('INSERT INTO slides (id, title, body, sort_order) VALUES (?, ?, ?, ?)');
  const seedSlides = db.transaction(() => {
    insertSlide.run(1, 'Agent Coding Session', `
      <h1 class="slide-main-title">Agent Coding Session</h1>
      <p class="slide-subtitle">仕様設計から AWS デプロイまで、AI と協働しながら学ぶ実践プロセス</p>
    `, 1);

    insertSlide.run(2, '背景・目的', `
      <h2>背景・目的</h2>
      <ul>
        <li>AI コード生成が一般化する中で、設計〜デプロイを通して理解したい</li>
        <li>完成品ではなく<strong>「学びの過程」</strong>を共有する</li>
      </ul>
    `, 2);

    insertSlide.run(3, '開発フロー', `
      <h2>開発フロー</h2>
      <div class="flow-steps">
        <span class="flow-step">💡 発想</span>
        <span class="flow-arrow">→</span>
        <span class="flow-step">📝 簡易仕様設計</span>
        <span class="flow-arrow">→</span>
        <span class="flow-step">⚙️ 実装</span>
        <span class="flow-arrow">→</span>
        <span class="flow-step">🚀 デプロイ</span>
        <span class="flow-arrow">→</span>
        <span class="flow-step">🔄 改善</span>
      </div>
    `, 3);

    insertSlide.run(4, '人間 × AI の役割分担', `
      <h2>人間 × AI の役割分担</h2>
      <table class="role-table">
        <thead>
          <tr><th>工程</th><th>人間</th><th>AI</th></tr>
        </thead>
        <tbody>
          <tr><td>アイデア・仕様設計</td><td>主担当</td><td>壁打ち相手</td></tr>
          <tr><td>実装</td><td>方針決定・レビュー</td><td>コード生成</td></tr>
          <tr><td>デプロイ・運用</td><td>実行・確認</td><td>手順補助</td></tr>
        </tbody>
      </table>
    `, 4);

    insertSlide.run(5, '学びと課題', `
      <h2>学びと課題</h2>
      <ul>
        <li>仕様が曖昧だと AI の出力も曖昧になる</li>
        <li>コード生成は速いが、整合性確認は人間が必要</li>
        <li>デプロイを通すと、コード生成だけでは気づけない問題が見える</li>
      </ul>
    `, 5);

    insertSlide.run(6, 'デモ紹介', `
      <h2>デモ紹介</h2>
      <p>このサイト自体が Web サーバーとして動いています。</p>
      <div class="demo-links-slide">
        <a href="/demo/crud">📝 CRUD デモ</a>
        <a href="/demo/filter">🔍 フィルタリングデモ</a>
        <a href="/demo/chart">📊 データ可視化デモ</a>
        <a href="/demo/realtime">⚡ リアルタイムデモ</a>
      </div>
    `, 6);
  });
  seedSlides();

  // Seed memos
  const insertMemo = db.prepare('INSERT INTO memos (title, content) VALUES (?, ?)');
  const seedMemos = db.transaction(() => {
    insertMemo.run('ようこそ', 'これは CRUD デモ用のサンプルメモです。自由に編集・削除してください。');
    insertMemo.run('会議メモ', '次回のミーティングは来週火曜日 14:00 から。アジェンダ：進捗確認、技術選定。');
    insertMemo.run('TODO リスト', '1. デモの動作確認\n2. スライドの練習\n3. 発表資料の最終チェック');
  });
  seedMemos();

  // Seed products (15-20 items)
  const insertProduct = db.prepare('INSERT INTO products (name, category, price, description) VALUES (?, ?, ?, ?)');
  const seedProducts = db.transaction(() => {
    // Electronics
    insertProduct.run('ワイヤレスイヤホン', 'Electronics', 12800, '高音質 Bluetooth 対応');
    insertProduct.run('USB-C ハブ', 'Electronics', 4980, '7-in-1 マルチポート');
    insertProduct.run('メカニカルキーボード', 'Electronics', 15800, '青軸、RGB バックライト');
    insertProduct.run('ポータブル充電器', 'Electronics', 3980, '10000mAh 急速充電対応');
    insertProduct.run('Web カメラ', 'Electronics', 6980, '1080p フルHD');
    // Books
    insertProduct.run('JavaScript 入門', 'Books', 2800, '初心者向けの定番書籍');
    insertProduct.run('データベース設計の教科書', 'Books', 3200, 'RDB の基礎から実践まで');
    insertProduct.run('AI と働く技術', 'Books', 1980, 'AI ツール活用のベストプラクティス');
    insertProduct.run('Web API 設計', 'Books', 3600, 'RESTful API のデザインパターン');
    // Clothing
    insertProduct.run('プログラマー T シャツ', 'Clothing', 2980, 'Hello World プリント');
    insertProduct.run('パーカー', 'Clothing', 5980, 'リモートワークに最適');
    insertProduct.run('キャップ', 'Clothing', 1980, 'シンプルロゴデザイン');
    // Food
    insertProduct.run('コーヒー豆 200g', 'Food', 1280, 'シングルオリジン、ミディアムロースト');
    insertProduct.run('エナジーバー 12 本', 'Food', 2400, 'プロテイン入り');
    insertProduct.run('抹茶ラテの素', 'Food', 980, '京都産宇治抹茶使用');
    insertProduct.run('ドリップバッグ 10 袋', 'Food', 1580, 'オフィス向けアソート');
    insertProduct.run('ナッツミックス', 'Food', 1480, 'アーモンド・カシューナッツ・くるみ');
  });
  seedProducts();

  // Seed sales (12 months × 3 categories)
  const insertSale = db.prepare('INSERT INTO sales (category, month, amount) VALUES (?, ?, ?)');
  const seedSales = db.transaction(() => {
    const categories = {
      'Electronics': [320, 280, 350, 410, 390, 450, 520, 480, 530, 600, 720, 850],
      'Books':       [150, 130, 180, 160, 140, 170, 190, 175, 200, 220, 250, 300],
      'Clothing':    [200, 180, 250, 220, 280, 310, 290, 260, 300, 340, 380, 420],
    };
    for (const [cat, amounts] of Object.entries(categories)) {
      amounts.forEach((amount, i) => {
        const month = `2025-${String(i + 1).padStart(2, '0')}`;
        insertSale.run(cat, month, amount * 1000);
      });
    }
  });
  seedSales();
}

module.exports = db;
