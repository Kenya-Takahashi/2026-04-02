const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Request logging middleware ---
const logRequest = db.prepare('INSERT INTO request_log (method, path) VALUES (?, ?)');
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/server')) {
    try { logRequest.run(req.method, req.path); } catch (_) {}
  }
  next();
});

// --- HTML Layout helper ---
function layout(title, bodyHtml, opts = {}) {
  const scripts = (opts.scripts || []).map(s =>
    s.startsWith('http') ? `<script src="${s}"></script>` : `<script src="${s}" defer></script>`
  ).join('\n');
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Agent Coding Session</title>
  <link rel="stylesheet" href="/style.css">
  ${scripts}
</head>
<body>
  <nav class="top-nav">
    <a href="/" class="nav-home">🏠 Agent Coding Session</a>
  </nav>
  <main class="container">
    ${bodyHtml}
  </main>
</body>
</html>`;
}

// =====================
// Pages
// =====================

// --- Top page ---
app.get('/', (req, res) => {
  res.send(layout('トップ', `
    <div class="hero">
      <h1>Agent Coding Session</h1>
      <p class="hero-subtitle">仕様設計から AWS デプロイまで、AI と協働しながら学ぶ実践プロセス</p>
      <div class="hero-description">
        <p>このサイトは Agent Coding（AI と協働する開発手法）で作られています。</p>
        <p>下のデモを通じて、Web サーバーで何ができるかを体験してください。</p>
        <p>スライドで背景も紹介しています。</p>
      </div>
    </div>
    <div class="card-grid">
      <a href="/slides" class="card card-link">
        <span class="card-emoji">📖</span>
        <span class="card-title">スライド</span>
        <span class="card-desc">背景・開発フロー・学びを紹介</span>
      </a>
      <a href="/demo/crud" class="card card-link">
        <span class="card-emoji">📝</span>
        <span class="card-title">CRUD デモ</span>
        <span class="card-desc">データの追加・編集・削除を体験</span>
      </a>
      <a href="/demo/filter" class="card card-link">
        <span class="card-emoji">🔍</span>
        <span class="card-title">検索デモ</span>
        <span class="card-desc">API パラメータで絞り込みを体験</span>
      </a>
      <a href="/demo/chart" class="card card-link">
        <span class="card-emoji">📊</span>
        <span class="card-title">グラフデモ</span>
        <span class="card-desc">JSON データをグラフに可視化</span>
      </a>
      <a href="/demo/realtime" class="card card-link">
        <span class="card-emoji">⚡</span>
        <span class="card-title">リアルタイムデモ</span>
        <span class="card-desc">サーバーのライブ情報を表示</span>
      </a>
    </div>
  `));
});

// --- Slides page ---
app.get('/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY sort_order').all();
  const slidesHtml = slides.map((s, i) => `
    <div class="slide" data-index="${i}" ${i === 0 ? '' : 'style="display:none"'}>
      <div class="slide-content">${s.body}</div>
    </div>
  `).join('');

  res.send(layout('スライド', `
    <div class="slides-container">
      <div class="slides-header">
        <a href="/" class="back-link">← トップに戻る</a>
        <span class="slide-counter"><span id="current-slide">1</span> / ${slides.length}</span>
      </div>
      <div class="slides-body">
        ${slidesHtml}
      </div>
      <div class="slides-nav">
        <button class="btn btn-secondary" id="prev-btn" disabled>← 前へ</button>
        <button class="btn btn-primary" id="next-btn">次へ →</button>
      </div>
    </div>
  `, { scripts: ['/slides.js'] }));
});

// --- CRUD demo page ---
app.get('/demo/crud', (req, res) => {
  res.send(layout('📝 CRUD デモ', `
    <div class="demo-page">
      <div class="demo-header">
        <a href="/" class="back-link">← トップに戻る</a>
        <h1>📝 データの追加・編集・削除</h1>
        <p class="demo-desc">フォームから入力 → API で保存 → 一覧に即反映される様子を体験</p>
      </div>

      <div class="memo-form-container">
        <h3>メモを作成</h3>
        <input type="text" id="memo-title" class="input" placeholder="タイトル">
        <textarea id="memo-content" class="input textarea" placeholder="本文" rows="3"></textarea>
        <button class="btn btn-primary" id="memo-save">保存</button>
        <input type="hidden" id="memo-edit-id" value="">
        <button class="btn btn-secondary" id="memo-cancel" style="display:none">キャンセル</button>
      </div>

      <div class="steps-container" id="steps" style="display:none">
        <div class="step" id="step1">
          <div class="step-label">Step 1: リクエスト</div>
          <pre class="step-content" id="step1-content"></pre>
        </div>
        <div class="step" id="step2">
          <div class="step-label">Step 2: レスポンス</div>
          <pre class="step-content" id="step2-content"></pre>
        </div>
        <div class="step" id="step3">
          <div class="step-label">Step 3: UI に反映</div>
          <div class="step-content" id="step3-content"></div>
        </div>
      </div>

      <h3>メモ一覧</h3>
      <div id="memo-list"></div>
    </div>
  `, { scripts: ['/demo-common.js', '/demo-crud.js'] }));
});

// --- Filter demo page ---
app.get('/demo/filter', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  const catOptions = categories.map(c => `<option value="${c.category}">${c.category}</option>`).join('');

  res.send(layout('🔍 検索デモ', `
    <div class="demo-page">
      <div class="demo-header">
        <a href="/" class="back-link">← トップに戻る</a>
        <h1>🔍 検索と絞り込み</h1>
        <p class="demo-desc">条件を変えると API パラメータが変わり、結果が変わる様子を体験</p>
      </div>

      <div class="filter-controls">
        <div class="filter-group">
          <label>カテゴリ</label>
          <select id="filter-category" class="input">
            <option value="">すべて</option>
            ${catOptions}
          </select>
        </div>
        <div class="filter-group">
          <label>価格上限: <span id="price-label">50000</span>円</label>
          <input type="range" id="filter-price" min="0" max="50000" step="500" value="50000">
        </div>
        <div class="filter-group">
          <label>テキスト検索</label>
          <input type="text" id="filter-q" class="input" placeholder="キーワード">
        </div>
        <button class="btn btn-primary" id="filter-search">検索</button>
      </div>

      <div class="steps-container" id="steps" style="display:none">
        <div class="step" id="step1">
          <div class="step-label">Step 1: リクエスト</div>
          <pre class="step-content" id="step1-content"></pre>
        </div>
        <div class="step" id="step2">
          <div class="step-label">Step 2: レスポンス</div>
          <pre class="step-content" id="step2-content"></pre>
        </div>
        <div class="step" id="step3">
          <div class="step-label">Step 3: UI に反映</div>
          <div class="step-content" id="step3-content"></div>
        </div>
      </div>
    </div>
  `, { scripts: ['/demo-common.js', '/demo-filter.js'] }));
});

// --- Chart demo page ---
app.get('/demo/chart', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM sales ORDER BY category').all();
  const catOptions = categories.map(c => `<option value="${c.category}">${c.category}</option>`).join('');

  res.send(layout('📊 グラフデモ', `
    <div class="demo-page">
      <div class="demo-header">
        <a href="/" class="back-link">← トップに戻る</a>
        <h1>📊 データをグラフにする</h1>
        <p class="demo-desc">API から取得した JSON データがグラフとして描画される様子を体験</p>
      </div>

      <div class="chart-controls">
        <div class="filter-group">
          <label>カテゴリ</label>
          <select id="chart-category" class="input">
            <option value="">全体</option>
            ${catOptions}
          </select>
        </div>
        <button class="btn btn-primary" id="chart-fetch">取得</button>
      </div>

      <div class="steps-container" id="steps" style="display:none">
        <div class="step" id="step1">
          <div class="step-label">Step 1: リクエスト</div>
          <pre class="step-content" id="step1-content"></pre>
        </div>
        <div class="step" id="step2">
          <div class="step-label">Step 2: レスポンス</div>
          <pre class="step-content" id="step2-content"></pre>
        </div>
        <div class="step" id="step3">
          <div class="step-label">Step 3: UI に反映 ↓</div>
          <div class="step-content" id="step3-content"><span style="color:var(--text-sub)">下のグラフエリアに描画されます</span></div>
        </div>
      </div>

      <div class="chart-area">
        <h3>グラフ</h3>
        <div class="chart-wrapper">
          <canvas id="sales-chart"></canvas>
        </div>
      </div>
    </div>
  `, { scripts: ['https://cdn.jsdelivr.net/npm/chart.js', '/demo-common.js', '/demo-chart.js'] }));
});

// --- Realtime demo page ---
app.get('/demo/realtime', (req, res) => {
  res.send(layout('⚡ リアルタイムデモ', `
    <div class="demo-page">
      <div class="demo-header">
        <a href="/" class="back-link">← トップに戻る</a>
        <h1>⚡ サーバーのライブ情報</h1>
        <p class="demo-desc">サーバーの状態がリアルタイムに更新される様子を体験</p>
      </div>

      <div class="steps-container" id="steps">
        <div class="step" id="step1">
          <div class="step-label">Step 1: リクエスト</div>
          <pre class="step-content" id="step1-content"></pre>
        </div>
        <div class="step" id="step2">
          <div class="step-label">Step 2: レスポンス</div>
          <pre class="step-content" id="step2-content"></pre>
        </div>
        <div class="step" id="step3">
          <div class="step-label">Step 3: UI に反映</div>
          <div class="step-content" id="step3-content">
            <div id="server-status"></div>
            <div id="request-counts"></div>
          </div>
        </div>
      </div>
    </div>
  `, { scripts: ['/demo-common.js', '/demo-realtime.js'] }));
});

// =====================
// API Routes
// =====================

// --- Slides API ---
app.get('/api/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY sort_order').all();
  res.json(slides);
});

// --- Memos API ---
app.get('/api/memos', (req, res) => {
  const memos = db.prepare('SELECT * FROM memos ORDER BY updated_at DESC').all();
  res.json(memos);
});

app.post('/api/memos', (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const result = db.prepare('INSERT INTO memos (title, content) VALUES (?, ?)').run(title, content || '');
  const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(memo);
});

app.put('/api/memos/:id', (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  db.prepare("UPDATE memos SET title = ?, content = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(title, content || '', req.params.id);
  const memo = db.prepare('SELECT * FROM memos WHERE id = ?').get(req.params.id);
  if (!memo) return res.status(404).json({ error: 'not found' });
  res.json(memo);
});

app.delete('/api/memos/:id', (req, res) => {
  const result = db.prepare('DELETE FROM memos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ deleted: true, id: Number(req.params.id) });
});

// --- Products API ---
app.get('/api/products', (req, res) => {
  const { category, price_max, q } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (price_max) { sql += ' AND price <= ?'; params.push(Number(price_max)); }
  if (q) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY category, price';
  const products = db.prepare(sql).all(...params);
  res.json(products);
});

// --- Sales API ---
app.get('/api/sales', (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT * FROM sales';
  const params = [];
  if (category) { sql += ' WHERE category = ?'; params.push(category); }
  sql += ' ORDER BY month, category';
  const sales = db.prepare(sql).all(...params);
  res.json(sales);
});

// --- Server status API ---
app.get('/api/server/status', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    uptime_seconds: Math.floor(process.uptime()),
    memory_mb: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
    heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
    node_version: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/server/requests', (req, res) => {
  const counts = db.prepare(`
    SELECT path, method, COUNT(*) as count
    FROM request_log
    GROUP BY method, path
    ORDER BY count DESC
  `).all();
  const total = db.prepare('SELECT COUNT(*) as total FROM request_log').get().total;
  res.json({ total, by_endpoint: counts });
});

// =====================
// Start
// =====================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
