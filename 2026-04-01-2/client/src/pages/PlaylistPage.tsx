import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Shuffle, Edit3, Trash2, ListMusic } from 'lucide-react'
import { api, type PlaylistDetail } from '../lib/api'
import { TrackList } from '../components/TrackList'
import { usePlayer } from '../contexts/PlayerContext'
import { formatDuration } from '../lib/utils'

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const { play, setQueue } = usePlayer()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    api.getPlaylist(Number(id)).then(r => {
      setPlaylist(r.playlist)
      setEditName(r.playlist.name)
      setEditDesc(r.playlist.description || '')
    }).catch(() => navigate('/'))
  }, [id])

  if (!playlist) return null

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return
    play(playlist.tracks[0], playlist.tracks)
  }

  const handleShuffle = () => {
    if (playlist.tracks.length === 0) return
    const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5)
    play(shuffled[0], shuffled)
  }

  const handleRemoveTrack = async (trackId: number) => {
    await api.removeTrackFromPlaylist(playlist.id, trackId)
    setPlaylist(prev => prev ? {
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId),
    } : null)
  }

  const handleSaveEdit = async () => {
    await api.updatePlaylist(playlist.id, { name: editName, description: editDesc })
    setPlaylist(prev => prev ? { ...prev, name: editName, description: editDesc } : null)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('このプレイリストを削除しますか？')) return
    await api.deletePlaylist(playlist.id)
    navigate('/library')
  }

  return (
    <div>
      <div className="playlist-header">
        <div className="playlist-cover">
          {playlist.cover_image_url ? <img src={playlist.cover_image_url} alt="" /> : <ListMusic size={64} />}
        </div>
        <div className="playlist-info">
          <div className="playlist-info-label">プレイリスト</div>
          <h1>{playlist.name}</h1>
          {playlist.description && <p>{playlist.description}</p>}
          <div className="playlist-meta">
            {playlist.tracks.length}曲 ・ {formatDuration(playlist.total_duration_ms)}
          </div>
        </div>
      </div>

      <div className="playlist-actions">
        <button className="btn btn-primary" onClick={handlePlayAll}>
          <Play size={16} /> 再生
        </button>
        <button className="btn btn-secondary" onClick={handleShuffle}>
          <Shuffle size={16} /> シャッフル
        </button>
        <button className="btn-icon" onClick={() => setEditing(true)} title="編集">
          <Edit3 size={16} />
        </button>
        <button className="btn-icon btn-danger" onClick={handleDelete} title="削除">
          <Trash2 size={16} />
        </button>
      </div>

      {playlist.tracks.length > 0 ? (
        <TrackList tracks={playlist.tracks} onRemove={handleRemoveTrack} onTrackUpdate={updated => setPlaylist(prev => prev ? { ...prev, tracks: prev.tracks.map(t => t.id === updated.id ? updated : t) } : null)} />
      ) : (
        <div className="empty-state">
          <ListMusic size={48} />
          <p>このプレイリストにはまだ曲がありません</p>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>プレイリストを編集</h2>
            <label>名前</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} />
            <label>説明</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
