import { usePlayer } from '../contexts/PlayerContext'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ChevronUp, Music } from 'lucide-react'
import { formatTime } from '../lib/utils'

export function PlayerBar() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    shuffle, repeat, togglePlay, next, prev, seek, setVolume,
    toggleShuffle, toggleRepeat, setFullscreen,
  } = usePlayer()

  if (!currentTrack) return null

  const cover = currentTrack.cover_image_url || currentTrack.album_cover

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seek(pct * duration)
  }

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    setVolume(Math.max(0, Math.min(1, pct)))
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="player-bar">
      <div className="player-track-info">
        <div className="player-cover" onClick={() => setFullscreen(true)}>
          {cover ? <img src={cover} alt="" /> : <Music size={20} />}
        </div>
        <div className="player-track-text">
          <div className="player-track-title">{currentTrack.title}</div>
          <div className="player-track-artist">{currentTrack.artist_name}</div>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className={`player-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
            <Shuffle size={16} />
          </button>
          <button className="player-btn" onClick={prev}>
            <SkipBack size={18} />
          </button>
          <button className="player-btn player-btn-play" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>
          <button className="player-btn" onClick={next}>
            <SkipForward size={18} />
          </button>
          <button className={`player-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat}>
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>
        <div className="player-progress">
          <span className="player-time">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleProgressClick}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <button className="player-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.8)}>
          {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <div className="volume-slider" onClick={handleVolumeClick}>
          <div className="volume-fill" style={{ width: `${volume * 100}%` }} />
        </div>
        <button className="player-btn" onClick={() => setFullscreen(true)}>
          <ChevronUp size={16} />
        </button>
      </div>
    </div>
  )
}
