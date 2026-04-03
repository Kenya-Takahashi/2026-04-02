import express, { Request, Response } from 'express';
import cors from 'cors';
import db, { initDb } from './db';

const app = express();
const port = Number(process.env.PORT || 3001);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));
app.use(express.json());

// Init DB
initDb().then(() => {
  console.log('Database initialized successfully.');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// API Routes

// Login (Simple username only)
app.post('/api/login', (req: Request, res: Response): any => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.json(row);
    } else {
      // Create user
      db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newRow) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(newRow);
        });
      });
    }
  });
});

// Get all tools and characters
app.get('/api/tools', (req: Request, res: Response): any => {
  const sql = `
    SELECT t.*, c.name as character_name, c.animal_type, c.color_accent, c.image_path, c.image_prompt, c.personality
    FROM tools t
    LEFT JOIN characters c ON t.id = c.tool_id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single tool by slug
app.get('/api/tools/:slug', (req: Request, res: Response): any => {
  const sql = `
    SELECT t.*, c.name as character_name, c.animal_type, c.color_accent, c.image_path, c.image_prompt, c.personality
    FROM tools t
    LEFT JOIN characters c ON t.id = c.tool_id
    WHERE t.slug = ?
  `;
  db.get(sql, [req.params.slug], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Tool not found' });
    res.json(row);
  });
});

// Get user favorites
app.get('/api/favorites/:username', (req: Request, res: Response): any => {
  const sql = `
    SELECT f.tool_id
    FROM favorites f
    JOIN users u ON f.user_id = u.id
    WHERE u.username = ?
  `;
  db.all(sql, [req.params.username], (err, rows: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map((r: any) => r.tool_id));
  });
});

// Toggle favorite
app.post('/api/favorites', (req: Request, res: Response): any => {
  const { username, tool_id } = req.body;
  
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    db.get('SELECT id FROM favorites WHERE user_id = ? AND tool_id = ?', [user.id, tool_id], (err, fav) => {
      if (err) return res.status(500).json({ error: err.message });
      if (fav) {
        db.run('DELETE FROM favorites WHERE user_id = ? AND tool_id = ?', [user.id, tool_id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ status: 'removed' });
        });
      } else {
        db.run('INSERT INTO favorites (user_id, tool_id) VALUES (?, ?)', [user.id, tool_id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ status: 'added' });
        });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
