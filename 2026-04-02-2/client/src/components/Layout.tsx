import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  username: string;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ username, onLogout, children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header username={username} onLogout={onLogout} />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
