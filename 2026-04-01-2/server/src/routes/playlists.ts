import { Router } from 'express'
import db from '../db.js'

export const playlistsRouter = Router()

// Get all playlists for a user
playlistsRouter.get('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const playlists = db.prepare(`
    SELECT p.*, COUNT(pt.id) as track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(userId)
  res.json({ playlists })
})

// Get single playlist with tracks
playlistsRouter.get('/:id', (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id) as any
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })

  const tracks = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover, pt.position
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position ASC
  `).all(req.params.id)

  const totalDuration = (tracks as any[]).reduce((sum, t) => sum + (t.duration_ms || 0), 0)
  res.json({ playlist: { ...playlist, tracks, total_duration_ms: totalDuration } })
})

// Create playlist
playlistsRouter.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 1
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const result = db.prepare(
    'INSERT INTO playlists (name, description, user_id) VALUES (?, ?, ?)'
  ).run(name, description || '', userId)

  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ playlist })
})

// Update playlist
playlistsRouter.put('/:id', (req, res) => {
  const { name, description } = req.body
  db.prepare('UPDATE playlists SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
    .run(name, description, req.params.id)

  const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id)
  res.json({ playlist })
})

// Delete playlist
playlistsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// Add track to playlist
playlistsRouter.post('/:id/tracks', (req, res) => {
  const { track_id } = req.body
  if (!track_id) return res.status(400).json({ error: 'track_id is required' })

  const maxPos = db.prepare(
    'SELECT MAX(position) as max_pos FROM playlist_tracks WHERE playlist_id = ?'
  ).get(req.params.id) as any

  const position = (maxPos?.max_pos ?? -1) + 1

  db.prepare(
    'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)'
  ).run(req.params.id, track_id, position)

  res.status(201).json({ success: true })
})

// Remove track from playlist
playlistsRouter.delete('/:id/tracks/:trackId', (req, res) => {
  db.prepare(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?'
  ).run(req.params.id, req.params.trackId)
  res.json({ success: true })
})
