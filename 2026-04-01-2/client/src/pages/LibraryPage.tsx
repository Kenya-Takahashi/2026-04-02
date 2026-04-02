import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListMusic, Upload, Plus, Music, Heart } from 'lucide-react'
import { api, type Track, type Playlist } from '../lib/api'
import { TrackList } from '../components/TrackList'

type Tab = 'playlists' | 'tracks' | 'favorites'

export function LibraryPage() {
  const [tab, setTab] = useState<Tab>('tracks')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [favorites, setFavorites] = useState<Track[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (tab === 'playlists') {
      api.getPlaylists().then(r => setPlaylists(r.playlists)).catch(() => {})
    } else if (tab === 'tracks') {
      api.getTracks(200).then(r => setTracks(r.tracks)).catch(() => {})
    } else {
      api.getFavorites().then(r => setFavorites(r.tracks)).catch(() => {})
    }
  }, [tab])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      setUploadProgress(0)
      try {
        const { track } = await api.uploadTrack(file, setUploadProgress)
        setTracks(prev => [track, ...prev])
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }

    setUploading(false)
    setUploadProgress(0)
  }

  const handleCreatePlaylist = async () => {
    const name = prompt('プレイリスト名を入力')
    if (!name) return
    const { playlist } = await api.createPlaylist(name)
    setPlaylists(prev => [playlist, ...prev])
  }

  return (
    <div>
      <h2 className="section-title">ライブラリ</h2>

      <div className="tabs">
        <button className={`tab ${tab === 'tracks' ? 'active' : ''}`} onClick={() => setTab('tracks')}>
          アップロード済み曲
        </button>
        <button className={`tab ${tab === 'playlists' ? 'active' : ''}`} onClick={() => setTab('playlists')}>
          プレイリスト
        </button>
        <button className={`tab ${tab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')}>
          お気に入り
        </button>
      </div>

      {tab === 'tracks' && (
        <>
          <div
            className="upload-area"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files) }}
          >
            <Upload />
            <p>クリックまたはドラッグ＆ドロップで曲をアップロード</p>
            <p className="upload-hint">MP3, WAV, FLAC, OGG, M4A, AAC (最大50MB)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,.wav,.flac,.ogg,.m4a,.aac"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleUpload(e.target.files)}
            />
            {uploading && (
              <div className="upload-progress">
                <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {tracks.length > 0 ? (
            <TrackList tracks={tracks} onTrackUpdate={updated => setTracks(prev => prev.map(t => t.id === updated.id ? updated : t))} />
          ) : (
            <div className="empty-state">
              <Music size={48} />
              <p>まだ曲がアップロードされていません</p>
            </div>
          )}
        </>
      )}

      {tab === 'playlists' && (
        <>
          <button className="btn btn-secondary" onClick={handleCreatePlaylist} style={{ marginBottom: 20 }}>
            <Plus size={16} /> 新規プレイリスト
          </button>
          {playlists.length > 0 ? (
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
          ) : (
            <div className="empty-state">
              <ListMusic size={48} />
              <p>プレイリストがまだありません</p>
            </div>
          )}
        </>
      )}

      {tab === 'favorites' && (
        favorites.length > 0 ? (
          <TrackList tracks={favorites} onTrackUpdate={updated => setFavorites(prev => prev.map(t => t.id === updated.id ? updated : t))} />
        ) : (
          <div className="empty-state">
            <Heart size={48} />
            <p>お気に入りの曲がまだありません</p>
          </div>
        )
      )}
    </div>
  )
}
