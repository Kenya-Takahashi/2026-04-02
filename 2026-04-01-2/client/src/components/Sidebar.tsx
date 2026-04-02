import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ListMusic, Plus, Heart, Clock } from 'lucide-react'
import { api, type Playlist } from '../lib/api'

export function Sidebar() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    api.getPlaylists().then(r => setPlaylists(r.playlists)).catch(() => {})
  }, [location.pathname])

  const handleCreate = async () => {
    const name = prompt('プレイリスト名を入力')
    if (!name) return
    const { playlist } = await api.createPlaylist(name)
    setPlaylists(prev => [playlist, ...prev])
    navigate(`/playlist/${playlist.id}`)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">メニュー</div>
        <button
          className={`sidebar-item ${location.pathname === '/library' ? 'active' : ''}`}
          onClick={() => navigate('/library')}
        >
          <Heart size={16} /> お気に入り
        </button>
        <button
          className={`sidebar-item ${location.pathname === '/' && location.hash === '' ? '' : ''}`}
          onClick={() => navigate('/')}
        >
          <Clock size={16} /> 最近再生した曲
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          プレイリスト
          <button className="btn-icon" onClick={handleCreate} style={{ padding: 2 }}>
            <Plus size={14} />
          </button>
        </div>
        {playlists.map(pl => (
          <button
            key={pl.id}
            className={`sidebar-item ${location.pathname === `/playlist/${pl.id}` ? 'active' : ''}`}
            onClick={() => navigate(`/playlist/${pl.id}`)}
          >
            <ListMusic size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
