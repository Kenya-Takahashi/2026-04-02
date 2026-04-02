const BASE = '/api'

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const userId = localStorage.getItem('userId')
  if (userId) headers['X-User-Id'] = userId
  return headers
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  // Auth
  login: (username: string) =>
    request<{ user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ username }) }),

  // Tracks
  getTracks: (limit = 50, offset = 0) =>
    request<{ tracks: Track[] }>(`/tracks?limit=${limit}&offset=${offset}`),

  getTrack: (id: number) =>
    request<{ track: Track }>(`/tracks/${id}`),

  updateTrack: (id: number, data: { title?: string; artist_name?: string; album_title?: string }) =>
    request<{ track: Track }>(`/tracks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTrack: (id: number) =>
    request<{ success: boolean }>(`/tracks/${id}`, { method: 'DELETE' }),

  // Playlists
  getPlaylists: () =>
    request<{ playlists: Playlist[] }>('/playlists'),

  getPlaylist: (id: number) =>
    request<{ playlist: PlaylistDetail }>(`/playlists/${id}`),

  createPlaylist: (name: string, description = '') =>
    request<{ playlist: Playlist }>('/playlists', { method: 'POST', body: JSON.stringify({ name, description }) }),

  updatePlaylist: (id: number, data: { name?: string; description?: string }) =>
    request<{ playlist: Playlist }>(`/playlists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePlaylist: (id: number) =>
    request<{ success: boolean }>(`/playlists/${id}`, { method: 'DELETE' }),

  addTrackToPlaylist: (playlistId: number, trackId: number) =>
    request<{ success: boolean }>(`/playlists/${playlistId}/tracks`, { method: 'POST', body: JSON.stringify({ track_id: trackId }) }),

  removeTrackFromPlaylist: (playlistId: number, trackId: number) =>
    request<{ success: boolean }>(`/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' }),

  // Search
  search: (q: string) =>
    request<{ tracks: Track[]; playlists: Playlist[] }>(`/search?q=${encodeURIComponent(q)}`),

  // Favorites
  getFavorites: () =>
    request<{ tracks: Track[] }>('/favorites'),

  addFavorite: (trackId: number) =>
    request<{ success: boolean }>('/favorites', { method: 'POST', body: JSON.stringify({ track_id: trackId }) }),

  removeFavorite: (trackId: number) =>
    request<{ success: boolean }>(`/favorites/${trackId}`, { method: 'DELETE' }),

  checkFavorite: (trackId: number) =>
    request<{ favorited: boolean }>(`/favorites/check/${trackId}`),

  // History
  getHistory: (limit = 20) =>
    request<{ tracks: Track[] }>(`/history?limit=${limit}`),

  recordPlay: (trackId: number) =>
    request<{ success: boolean }>('/history', { method: 'POST', body: JSON.stringify({ track_id: trackId }) }),

  // Artists
  getArtists: () =>
    request<{ artists: any[] }>('/artists'),

  // Upload
  uploadTrack: (file: File, onProgress?: (pct: number) => void) => {
    return new Promise<{ track: Track }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('audio', file)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed')))
      xhr.open('POST', BASE + '/upload')
      const userId = localStorage.getItem('userId')
      if (userId) xhr.setRequestHeader('X-User-Id', userId)
      xhr.send(formData)
    })
  },
}

// Types
export interface Track {
  id: number
  title: string
  artist_id: number
  album_id: number | null
  duration_ms: number
  audio_url: string
  cover_image_url: string | null
  track_number: number | null
  artist_name: string
  album_title: string | null
  album_cover: string | null
  created_at: string
}

export interface Playlist {
  id: number
  name: string
  description: string
  user_id: number
  cover_image_url: string | null
  is_public: number
  track_count: number
  created_at: string
}

export interface PlaylistDetail extends Playlist {
  tracks: Track[]
  total_duration_ms: number
}
