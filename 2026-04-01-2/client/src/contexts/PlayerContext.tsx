import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import type { Track } from '../lib/api'
import { api } from '../lib/api'

type RepeatMode = 'off' | 'all' | 'one'

interface PlayerContextType {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  isFullscreen: boolean

  play: (track: Track, trackList?: Track[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setFullscreen: (val: boolean) => void
  setQueue: (tracks: Track[], startIndex?: number) => void
}

const PlayerContext = createContext<PlayerContextType>(null!)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueueState] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('volume')
    return saved ? Number(saved) : 0.8
  })
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>('off')
  const [isFullscreen, setFullscreen] = useState(false)

  // Init audio element
  useEffect(() => {
    const audio = new Audio()
    audio.volume = volume
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('durationchange', () => setDuration(audio.duration))
    audio.addEventListener('ended', () => handleEnded())
    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else {
      nextTrack()
    }
  }, [repeat, queue, queueIndex, shuffle])

  // Update ended handler when deps change
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handler = () => handleEnded()
    audio.addEventListener('ended', handler)
    return () => audio.removeEventListener('ended', handler)
  }, [handleEnded])

  const playTrack = useCallback((track: Track) => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = track.audio_url
    audio.play()
    setCurrentTrack(track)
    api.recordPlay(track.id).catch(() => {})
  }, [])

  const play = useCallback((track: Track, trackList?: Track[]) => {
    if (trackList) {
      const idx = trackList.findIndex(t => t.id === track.id)
      setQueueState(trackList)
      setQueueIndex(idx >= 0 ? idx : 0)
    }
    playTrack(track)
  }, [playTrack])

  const pause = useCallback(() => { audioRef.current?.pause() }, [])
  const resume = useCallback(() => { audioRef.current?.play() }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else resume()
  }, [isPlaying, pause, resume])

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return
    let nextIdx: number
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length)
    } else {
      nextIdx = queueIndex + 1
      if (nextIdx >= queue.length) {
        if (repeat === 'all') nextIdx = 0
        else return
      }
    }
    setQueueIndex(nextIdx)
    playTrack(queue[nextIdx])
  }, [queue, queueIndex, shuffle, repeat, playTrack])

  const prev = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    if (queue.length === 0) return
    let prevIdx = queueIndex - 1
    if (prevIdx < 0) prevIdx = repeat === 'all' ? queue.length - 1 : 0
    setQueueIndex(prevIdx)
    playTrack(queue[prevIdx])
  }, [queue, queueIndex, repeat, playTrack])

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time
  }, [])

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol)
    if (audioRef.current) audioRef.current.volume = vol
    localStorage.setItem('volume', String(vol))
  }, [])

  const toggleShuffle = useCallback(() => setShuffle(s => !s), [])
  const toggleRepeat = useCallback(() => {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')
  }, [])

  const setQueue = useCallback((tracks: Track[], startIndex = 0) => {
    setQueueState(tracks)
    setQueueIndex(startIndex)
  }, [])

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, queueIndex, isPlaying, currentTime, duration,
      volume, shuffle, repeat, isFullscreen,
      play, pause, resume, togglePlay, next: nextTrack, prev, seek, setVolume,
      toggleShuffle, toggleRepeat, setFullscreen, setQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
