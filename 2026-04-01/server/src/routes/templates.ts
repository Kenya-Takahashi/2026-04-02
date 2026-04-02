import { Router, Request, Response } from 'express';
import db from '../db.js';
import { Template } from '../types.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const templates = db.prepare(
    'SELECT id, name, tab_type, created_at, updated_at FROM templates ORDER BY updated_at DESC'
  ).all();
  res.json(templates);
});

router.get('/:id', (req: Request, res: Response) => {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id) as Template | undefined;
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(template);
});

router.post('/', (req: Request, res: Response) => {
  const { name, tab_type, form_data, generated_prompt } = req.body;
  if (!name || !tab_type || !form_data || !generated_prompt) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO templates (name, tab_type, form_data, generated_prompt) VALUES (?, ?, ?, ?)'
  ).run(name, tab_type, form_data, generated_prompt);
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid) as Template;
  res.status(201).json(template);
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, tab_type, form_data, generated_prompt } = req.body;
  if (!name || !tab_type || !form_data || !generated_prompt) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const result = db.prepare(
    "UPDATE templates SET name = ?, tab_type = ?, form_data = ?, generated_prompt = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, tab_type, form_data, generated_prompt, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id) as Template;
  res.json(template);
});

router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.status(204).send();
});

export default router;
