import { Router } from 'express'
import db from '../db.js'

export const artistsRouter = Router()

artistsRouter.get('/', (_req, res) => {
  const artists = db.prepare('SELECT * FROM artists ORDER BY name ASC').all()
  res.json({ artists })
})

artistsRouter.get('/:id', (req, res) => {
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(req.params.id)
  if (!artist) return res.status(404).json({ error: 'Artist not found' })

  const tracks = db.prepare(`
    SELECT t.*, al.title as album_title, al.cover_image_url as album_cover
    FROM tracks t
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.artist_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id)

  const albums = db.prepare('SELECT * FROM albums WHERE artist_id = ? ORDER BY release_date DESC').all(req.params.id)

  res.json({ artist, tracks, albums })
})
