import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseBuffer } from 'music-metadata'
import fs from 'fs'
import db from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads')

fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
  limits: { fileSize: 50 * 1024 * 1024 },
})

export const uploadRouter = Router()

uploadRouter.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' })

  const audioUrl = `/uploads/${req.file.filename}`
  let title = path.parse(req.file.originalname).name
  let artistName = req.body.artist || 'Unknown Artist'
  let albumTitle = req.body.album || ''
  let durationMs = 0
  let coverImageUrl: string | null = null

  // Extract metadata
  try {
    const buffer = fs.readFileSync(req.file.path)
    const metadata = await parseBuffer(buffer, { mimeType: req.file.mimetype as any })
    if (metadata.common.title) title = metadata.common.title
    if (metadata.common.artist) artistName = metadata.common.artist
    if (metadata.common.album) albumTitle = metadata.common.album
    if (metadata.format.duration) durationMs = Math.round(metadata.format.duration * 1000)

    // Extract cover art
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0]
      const ext = pic.format === 'image/png' ? '.png' : '.jpg'
      const coverFilename = `cover-${Date.now()}${ext}`
      fs.writeFileSync(path.join(uploadsDir, coverFilename), pic.data)
      coverImageUrl = `/uploads/${coverFilename}`
    }
  } catch {
    // Metadata extraction failed, use defaults
  }

  // Find or create artist
  let artist = db.prepare('SELECT * FROM artists WHERE name = ?').get(artistName) as any
  if (!artist) {
    const result = db.prepare('INSERT INTO artists (name) VALUES (?)').run(artistName)
    artist = { id: result.lastInsertRowid }
  }

  // Find or create album
  let albumId: number | null = null
  if (albumTitle) {
    let album = db.prepare('SELECT * FROM albums WHERE title = ? AND artist_id = ?').get(albumTitle, artist.id) as any
    if (!album) {
      const result = db.prepare('INSERT INTO albums (title, artist_id, cover_image_url) VALUES (?, ?, ?)').run(albumTitle, artist.id, coverImageUrl)
      album = { id: result.lastInsertRowid }
    }
    albumId = album.id
  }

  // Create track
  const result = db.prepare(
    'INSERT INTO tracks (title, artist_id, album_id, duration_ms, audio_url, cover_image_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, artist.id, albumId, durationMs, audioUrl, coverImageUrl)

  const track = db.prepare(`
    SELECT t.*, a.name as artist_name, al.title as album_title, al.cover_image_url as album_cover
    FROM tracks t
    LEFT JOIN artists a ON t.artist_id = a.id
    LEFT JOIN albums al ON t.album_id = al.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({ track })
})
