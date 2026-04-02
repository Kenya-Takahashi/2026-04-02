import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Music, ListMusic } from 'lucide-react'
import { api, type Track, type Playlist } from '../lib/api'
import { TrackList } from '../components/TrackList'

type Filter = 'all' | 'tracks' | 'playlists'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setTracks([])
      setPlaylists([])
      setSearched(false)
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const result = await api.search(query.trim())
      setTracks(result.tracks)
      setPlaylists(result.playlists)
      setSearched(true)
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [query])

  const showTracks = filter === 'all' || filter === 'tracks'
  const showPlaylists = filter === 'all' || filter === 'playlists'

  return (
    <div>
      <h2 className="section-title">検索</h2>
      <div className="search-bar">
        <Search />
        <input
          type="text"
          placeholder="曲名、アーティスト、アルバムで検索..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {searched && (
        <div className="filter-chips">
          {(['all', 'tracks', 'playlists'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'すべて' : f === 'tracks' ? '曲' : 'プレイリスト'}
            </button>
          ))}
        </div>
      )}

      {searched && showTracks && tracks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>曲</h3>
          <TrackList tracks={tracks} onTrackUpdate={updated => setTracks(prev => prev.map(t => t.id === updated.id ? updated : t))} />
        </section>
      )}

      {searched && showPlaylists && playlists.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>プレイリスト</h3>
          <div className="card-grid">
            {playlists.map(pl => (
              <div key={pl.id} className="card" onClick={() => navigate(`/playlist/${pl.id}`)}>
                <div className="card-image">
                  {pl.cover_image_url ? <img src={pl.cover_image_url} alt="" /> : <ListMusic />}
                </div>
                <div className="card-title">{pl.name}</div>
                <div className="card-subtitle">{pl.track_count}曲</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {searched && tracks.length === 0 && playlists.length === 0 && (
        <div className="empty-state">
          <Search size={48} />
          <p>「{query}」に一致する結果がありません</p>
        </div>
      )}
    </div>
  )
}
