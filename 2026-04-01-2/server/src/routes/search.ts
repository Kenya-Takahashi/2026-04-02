import { Router } from 'express'
import db from '../db.js'

export const searchRouter = Router()

searchRouter.get('/', (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q) return res.json({ tracks: [], playlists: [] })

  const like = `%${q}%`

  const tracks = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.title LIKE ? OR a.name LIKE ? OR al.title LIKE ?
    LIMIT 30
  `).all(like, like, like)

  const playlists = db.prepare(`
    SELECT p.*, COUNT(pt.id) as track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    WHERE p.name LIKE ? OR p.description LIKE ?
    GROUP BY p.id
    LIMIT 20
  `).all(like, like)

  res.json({ tracks, playlists })
})
