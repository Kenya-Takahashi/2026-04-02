import { usePlayer } from '../contexts/PlayerContext'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ChevronDown, Music, Heart } from 'lucide-react'
import { formatTime } from '../lib/utils'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export function FullscreenPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    shuffle, repeat, isFullscreen,
    togglePlay, next, prev, seek, setVolume,
    toggleShuffle, toggleRepeat, setFullscreen,
  } = usePlayer()

  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    if (currentTrack) {
      api.checkFavorite(currentTrack.id).then(r => setIsFavorited(r.favorited)).catch(() => {})
    }
  }, [currentTrack?.id])

  if (!isFullscreen || !currentTrack) return null

  const cover = currentTrack.cover_image_url || currentTrack.album_cover
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }

  const toggleFavorite = async () => {
    if (isFavorited) {
      await api.removeFavorite(currentTrack.id)
    } else {
      await api.addFavorite(currentTrack.id)
    }
    setIsFavorited(!isFavorited)
  }

  return (
    <div className="fullscreen-player">
      <button className="fs-close btn-icon" onClick={() => setFullscreen(false)}>
        <ChevronDown size={24} />
      </button>

      <div className="fs-cover">
        {cover ? <img src={cover} alt="" /> : <Music />}
      </div>

      <div className="fs-title">{currentTrack.title}</div>
      <div className="fs-artist">{currentTrack.artist_name}</div>

      <div className="player-progress">
        <span className="player-time">{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleProgressClick}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="player-time">{formatTime(duration)}</span>
      </div>

      <div className="player-buttons">
        <button className={`player-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
          <Shuffle size={20} />
        </button>
        <button className="player-btn" onClick={prev}>
          <SkipBack size={22} />
        </button>
        <button className="player-btn player-btn-play" onClick={togglePlay}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />}
        </button>
        <button className="player-btn" onClick={next}>
          <SkipForward size={22} />
        </button>
        <button className={`player-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat}>
          {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32 }}>
        <button className={`player-btn ${isFavorited ? 'active' : ''}`} onClick={toggleFavorite}>
          <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="player-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.8)}>
            {volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <div className="volume-slider" onClick={handleVolumeClick}>
            <div className="volume-fill" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
