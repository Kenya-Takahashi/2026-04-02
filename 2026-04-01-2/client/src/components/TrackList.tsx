import { Music, Heart, Pencil, ListPlus } from 'lucide-react'
import { usePlayer } from '../contexts/PlayerContext'
import type { Track, Playlist } from '../lib/api'
import { api } from '../lib/api'
import { formatDuration } from '../lib/utils'
import { useState, useEffect } from 'react'

interface Props {
  tracks: Track[]
  showHeader?: boolean
  showAlbum?: boolean
  onRemove?: (trackId: number) => void
  onTrackUpdate?: (track: Track) => void
}

export function TrackList({ tracks, showHeader = true, showAlbum = true, onRemove, onTrackUpdate }: Props) {
  const { play, currentTrack, isPlaying } = usePlayer()
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editArtist, setEditArtist] = useState('')
  const [editAlbum, setEditAlbum] = useState('')
  const [saving, setSaving] = useState(false)

  // Add to playlist state
  const [addingTrack, setAddingTrack] = useState<Track | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  useEffect(() => {
    const ids = tracks.map(t => t.id)
    Promise.all(ids.map(id => api.checkFavorite(id).then(r => r.favorited ? id : null)))
      .then(results => setFavorites(new Set(results.filter((id): id is number => id !== null))))
      .catch(() => {})
  }, [tracks])

  const toggleFavorite = async (trackId: number) => {
    if (favorites.has(trackId)) {
      await api.removeFavorite(trackId)
      setFavorites(prev => { const s = new Set(prev); s.delete(trackId); return s })
    } else {
      await api.addFavorite(trackId)
      setFavorites(prev => new Set(prev).add(trackId))
    }
  }

  const openEdit = (track: Track) => {
    setEditingTrack(track)
    setEditTitle(track.title)
    setEditArtist(track.artist_name)
    setEditAlbum(track.album_title || '')
  }

  const handleSaveEdit = async () => {
    if (!editingTrack) return
    setSaving(true)
    try {
      const { track: updated } = await api.updateTrack(editingTrack.id, {
        title: editTitle,
        artist_name: editArtist,
        album_title: editAlbum,
      })
      onTrackUpdate?.(updated)
      setEditingTrack(null)
    } catch (err) {
      console.error('Failed to update track:', err)
    } finally {
      setSaving(false)
    }
  }

  const openAddToPlaylist = async (track: Track) => {
    setAddingTrack(track)
    setLoadingPlaylists(true)
    try {
      const { playlists } = await api.getPlaylists()
      setPlaylists(playlists)
    } catch {
      setPlaylists([])
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!addingTrack) return
    try {
      await api.addTrackToPlaylist(playlistId, addingTrack.id)
      setAddingTrack(null)
    } catch (err) {
      console.error('Failed to add track to playlist:', err)
    }
  }

  return (
    <div className="track-list">
      {showHeader && (
        <div className="track-list-header">
          <span>#</span>
          <span>タイトル</span>
          {showAlbum && <span>アルバム</span>}
          <span style={{ textAlign: 'right' }}>時間</span>
          <span></span>
        </div>
      )}
      {tracks.map((track, i) => {
        const isCurrent = currentTrack?.id === track.id
        const cover = track.cover_image_url || track.album_cover
        return (
          <div
            key={track.id}
            className={`track-row ${isCurrent && isPlaying ? 'playing' : ''}`}
            onClick={() => play(track, tracks)}
            style={{ cursor: 'pointer' }}
          >
            <span className="track-row-num">
              {i + 1}
            </span>
            <div className="track-row-info">
              <div className="track-row-cover">
                {cover ? <img src={cover} alt="" /> : <Music size={18} />}
              </div>
              <div className="track-row-text">
                <div className="track-row-title" style={isCurrent ? { color: 'var(--accent)' } : {}}>
                  {track.title}
                </div>
                <div className="track-row-artist">{track.artist_name}</div>
              </div>
            </div>
            {showAlbum && <span className="track-row-album">{track.album_title || '-'}</span>}
            <span className="track-row-duration">{formatDuration(track.duration_ms)}</span>
            <div className="track-row-actions">
              <button
                className={favorites.has(track.id) ? 'favorited' : ''}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id) }}
                title={favorites.has(track.id) ? 'お気に入り解除' : 'お気に入りに追加'}
              >
                <Heart size={14} fill={favorites.has(track.id) ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openAddToPlaylist(track) }}
                title="プレイリストに追加"
              >
                <ListPlus size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(track) }}
                title="曲情報を編集"
              >
                <Pencil size={14} />
              </button>
              {onRemove && (
                <button onClick={(e) => { e.stopPropagation(); onRemove(track.id) }} title="削除">
                  ×
                </button>
              )}
            </div>
          </div>
        )
      })}

      {editingTrack && (
        <div className="modal-overlay" onClick={() => setEditingTrack(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>曲情報を編集</h2>
            <label>タイトル</label>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <label>アーティスト</label>
            <input value={editArtist} onChange={e => setEditArtist(e.target.value)} />
            <label>アルバム</label>
            <input value={editAlbum} onChange={e => setEditAlbum(e.target.value)} placeholder="（空欄でアルバムなし）" />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingTrack(null)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addingTrack && (
        <div className="modal-overlay" onClick={() => setAddingTrack(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>プレイリストに追加</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              「{addingTrack.title}」を追加するプレイリストを選択
            </p>
            {loadingPlaylists ? (
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>読み込み中...</p>
            ) : playlists.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
                {playlists.map(pl => (
                  <button
                    key={pl.id}
                    className="sidebar-item"
                    onClick={() => handleAddToPlaylist(pl.id)}
                    style={{ padding: '10px 12px' }}
                  >
                    <ListPlus size={16} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{pl.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{pl.track_count}曲</span>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>
                プレイリストがありません。先にプレイリストを作成してください。
              </p>
            )}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setAddingTrack(null)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
