import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { PlayerBar } from './components/PlayerBar'
import { FullscreenPlayer } from './components/FullscreenPlayer'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'

export function App() {
  const { user } = useAuth()

  if (!user) return <LoginPage />

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </main>
      </div>
      <PlayerBar />
      <FullscreenPlayer />
    </div>
  )
}
