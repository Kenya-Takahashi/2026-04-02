import React from 'react';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, onLogout }) => {
  return (
    <header className="header">
      <div className="header-title">Agentic Coding Tools</div>
      <div className="header-user">
        <span>{username}</span>
        <button onClick={onLogout} className="btn" style={{padding: '0.25rem 0.5rem'}} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
