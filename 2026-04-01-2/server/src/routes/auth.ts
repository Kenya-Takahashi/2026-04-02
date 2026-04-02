import { Router } from 'express'
import db from '../db.js'

export const authRouter = Router()

// Login/register by username only
authRouter.post('/login', (req, res) => {
  const { username } = req.body
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }

  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
  if (!user) {
    const result = db.prepare('INSERT INTO users (username, display_name) VALUES (?, ?)').run(username, username)
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
  }

  res.json({ user })
})

// Get current user
authRouter.get('/me', (req, res) => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({ user })
})
