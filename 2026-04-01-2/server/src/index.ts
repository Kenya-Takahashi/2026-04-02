import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import { tracksRouter } from './routes/tracks.js'
import { playlistsRouter } from './routes/playlists.js'
import { searchRouter } from './routes/search.js'
import { favoritesRouter } from './routes/favorites.js'
import { authRouter } from './routes/auth.js'
import { historyRouter } from './routes/history.js'
import { artistsRouter } from './routes/artists.js'
import { uploadRouter } from './routes/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')))

// Serve client build in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
app.use(express.static(clientDist))

// API routes
app.use('/api/auth', authRouter)
app.use('/api/tracks', tracksRouter)
app.use('/api/playlists', playlistsRouter)
app.use('/api/search', searchRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/history', historyRouter)
app.use('/api/artists', artistsRouter)
app.use('/api/upload', uploadRouter)

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

initDB()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
