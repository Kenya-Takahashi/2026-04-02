import { Router } from 'express'
import db from '../db.js'

export const tracksRouter = Router()

// Get all tracks
tracksRouter.get('/', (req, res) => {
  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0
  const tracks = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset)
  res.json({ tracks })
})

// Get single track
tracksRouter.get('/:id', (req, res) => {
  const track = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.id = ?
  `).get(req.params.id)

  if (!track) return res.status(404).json({ error: 'Track not found' })
  res.json({ track })
})

// Update track metadata
tracksRouter.put('/:id', (req, res) => {
  const { title, artist_name, album_title } = req.body
  const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(req.params.id) as any
  if (!track) return res.status(404).json({ error: 'Track not found' })

  // Update artist if changed
  let artistId = track.artist_id
  if (artist_name !== undefined) {
    let artist = db.prepare('SELECT * FROM artists WHERE name = ?').get(artist_name) as any
    if (!artist) {
      const result = db.prepare('INSERT INTO artists (name) VALUES (?)').run(artist_name)
      artist = { id: result.lastInsertRowid }
    }
    artistId = artist.id
  }

  // Update album if changed
  let albumId = track.album_id
  if (album_title !== undefined) {
    if (album_title === '') {
      albumId = null
    } else {
      let album = db.prepare('SELECT * FROM albums WHERE title = ? AND artist_id = ?').get(album_title, artistId) as any
      if (!album) {
        const result = db.prepare('INSERT INTO albums (title, artist_id) VALUES (?, ?)').run(album_title, artistId)
        album = { id: result.lastInsertRowid }
      }
      albumId = album.id
    }
  }

  db.prepare(
    'UPDATE tracks SET title = COALESCE(?, title), artist_id = ?, album_id = ? WHERE id = ?'
  ).run(title ?? track.title, artistId, albumId, req.params.id)

  const updated = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.id = ?
  `).get(req.params.id)

  res.json({ track: updated })
})

// Delete track
tracksRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tracks WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})
