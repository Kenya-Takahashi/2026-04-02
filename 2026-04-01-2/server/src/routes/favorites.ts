import { Router } from 'express'
import db from '../db.js'

export const favoritesRouter = Router()

// Get user's favorites
favoritesRouter.get('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const tracks = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover, f.created_at as favorited_at
    FROM favorites f
    JOIN tracks t ON f.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(userId)
  res.json({ tracks })
})

// Add favorite
favoritesRouter.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const { track_id } = req.body
  if (!track_id) return res.status(400).json({ error: 'track_id is required' })

  try {
    db.prepare('INSERT INTO favorites (user_id, track_id) VALUES (?, ?)').run(userId, track_id)
    res.status(201).json({ success: true })
  } catch {
    res.json({ success: true }) // Already favorited
  }
})

// Remove favorite
favoritesRouter.delete('/:trackId', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND track_id = ?').run(userId, req.params.trackId)
  res.json({ success: true })
})

// Check if favorited
favoritesRouter.get('/check/:trackId', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND track_id = ?').get(userId, req.params.trackId)
  res.json({ favorited: !!fav })
})
