import { NavLink } from 'react-router-dom'
import { Music, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="header-logo">
        <Music size={22} />
        My Spotify
      </div>
      <nav className="header-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
          ホーム
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => isActive ? 'active' : ''}>
          検索
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => isActive ? 'active' : ''}>
          ライブラリ
        </NavLink>
      </nav>
      <div className="header-right">
        {user && (
          <>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user.display_name}</span>
            <button className="btn-icon" onClick={logout} title="ログアウト">
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  )
}
