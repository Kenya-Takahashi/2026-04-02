import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Terminal, Box, Monitor, Server, Cloud, Wand2, Code } from 'lucide-react';
import { apiFetch } from '../lib/api';

const icons: Record<string, any> = {
  'claude-code': Terminal,
  'openclaw': Code,
  'docker': Box,
  'ubuntu': Monitor,
  'linux': Server,
  'codex': Cloud,
  'antigravity': Wand2
};

const Sidebar: React.FC = () => {
  const { data: tools } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const res = await apiFetch('/tools');
      return res.json();
    }
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header">Tools</div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="icon"><Home size={18} /></span>
          Main
        </NavLink>
        {tools && tools.map((tool: any) => {
          const Icon = icons[tool.slug] || Box;
          return (
            <NavLink 
              key={tool.id} 
              to={`/tools/${tool.slug}`} 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon"><Icon size={18} /></span>
              {tool.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
