import { Router } from 'express'
import db from '../db.js'

export const historyRouter = Router()

// Get recent play history
historyRouter.get('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const limit = Number(req.query.limit) || 20
  const tracks = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover, h.played_at
    FROM play_history h
    JOIN tracks t ON h.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE h.user_id = ?
    ORDER BY h.played_at DESC
    LIMIT ?
  `).all(userId, limit)
  res.json({ tracks })
})

// Record play
historyRouter.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const { track_id } = req.body
  if (!track_id) return res.status(400).json({ error: 'track_id is required' })

  db.prepare('INSERT INTO play_history (user_id, track_id) VALUES (?, ?)').run(userId, track_id)
  res.status(201).json({ success: true })
})
