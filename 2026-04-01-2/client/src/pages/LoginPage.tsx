import { useState } from 'react'
import { Music } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    await login(username.trim())
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20, color: 'var(--text-primary)' }}>
          <Music size={40} />
        </div>
        <h1>My Spotify</h1>
        <p>ユーザー名を入力してください</p>
        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
        />
        <button type="submit">ログイン</button>
      </form>
    </div>
  )
}
