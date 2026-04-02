import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music, ListMusic } from 'lucide-react'
import { api, type Track, type Playlist } from '../lib/api'
import { usePlayer } from '../contexts/PlayerContext'

export function HomePage() {
  const [recentTracks, setRecentTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [allTracks, setAllTracks] = useState<Track[]>([])
  const { play } = usePlayer()
  const navigate = useNavigate()

  useEffect(() => {
    api.getHistory(10).then(r => setRecentTracks(r.tracks)).catch(() => {})
    api.getPlaylists().then(r => setPlaylists(r.playlists)).catch(() => {})
    api.getTracks(20).then(r => setAllTracks(r.tracks)).catch(() => {})
  }, [])

  return (
    <div>
      {recentTracks.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-title">最近再生した曲</h2>
          <div className="horizontal-scroll">
            {recentTracks.map(track => {
              const cover = track.cover_image_url || track.album_cover
              return (
                <div key={track.id + '-' + track.created_at} className="card" onClick={() => play(track, recentTracks)}>
                  <div className="card-image">
                    {cover ? <img src={cover} alt="" /> : <Music />}
                  </div>
                  <div className="card-title">{track.title}</div>
                  <div className="card-subtitle">{track.artist_name}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {playlists.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-title">プレイリスト</h2>
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

      {allTracks.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-title">すべての曲</h2>
          <div className="card-grid">
            {allTracks.map(track => {
              const cover = track.cover_image_url || track.album_cover
              return (
                <div key={track.id} className="card" onClick={() => play(track, allTracks)}>
                  <div className="card-image">
                    {cover ? <img src={cover} alt="" /> : <Music />}
                  </div>
                  <div className="card-title">{track.title}</div>
                  <div className="card-subtitle">{track.artist_name}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {allTracks.length === 0 && recentTracks.length === 0 && (
        <div className="empty-state">
          <Music size={48} />
          <p>まだ曲がありません。ライブラリから曲をアップロードしましょう。</p>
        </div>
      )}
    </div>
  )
}
