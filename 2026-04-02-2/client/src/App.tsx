import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Main from './pages/Main';
import ToolDetail from './pages/ToolDetail';
import { apiFetch } from './lib/api';

const queryClient = new QueryClient();

function App() {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [showLogin, setShowLogin] = useState<boolean>(!username);
  const [inputName, setInputName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setErrorMsg('');
    try {
      const res = await apiFetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: inputName.trim() })
      });
      if (res.ok) {
        setUsername(inputName.trim());
        localStorage.setItem('username', inputName.trim());
        setShowLogin(false);
      } else {
        const errData = await res.json().catch(() => ({error: 'Network error'}));
        setErrorMsg(errData.error || 'Failed to login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Cannot connect to server. Please try again.');
    }
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem('username');
    setShowLogin(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {showLogin && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 style={{marginTop: 0}}>Agentic Coding Tools</h2>
              <p>Please enter your username.</p>
              <form onSubmit={handleLogin}>
                {errorMsg && <div style={{ color: '#eb5757', marginBottom: '1rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
                <div className="form-group">
                  <input
                    type="text"
                    className="input"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Username"
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
                  Login
                </button>
              </form>
            </div>
          </div>
        )}
        
        {!showLogin && username && (
          <Layout username={username} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Main username={username} />} />
              <Route path="/tools/:slug" element={<ToolDetail username={username} />} />
            </Routes>
          </Layout>
        )}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
