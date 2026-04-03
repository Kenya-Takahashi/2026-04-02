import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface MainProps {
  username: string;
}

const Main: React.FC<MainProps> = ({ username }) => {
  const queryClient = useQueryClient();

  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const res = await apiFetch('/tools');
      return res.json();
    }
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', username],
    queryFn: async () => {
      const res = await apiFetch(`/favorites/${username}`);
      return res.json();
    }
  });

  const toggleFavorite = useMutation({
    mutationFn: async (tool_id: number) => {
      const res = await apiFetch('/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, tool_id })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', username] });
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <img src="/images/main.png" alt="Agentic Coding Tools" className="hero-image" />
      <h1>Agentic Coding Tools</h1>
      <p className="page-description">
        これからの開発を劇的に変える、Agentic Coding に不可欠なツールたち。
        それぞれ個性豊かなキャラクターとして紹介します。
      </p>

      <h2>ツール一覧</h2>
      <div className="card-grid">
        {tools && tools.map((tool: any) => {
          const isFav = favorites?.includes(tool.id);
          return (
            <div key={tool.id} className="card">
              <Link to={`/tools/${tool.slug}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                <div className="card-image-wrap">
                  <img src={tool.image_path} alt={tool.name} className="card-image" />
                </div>
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div className="card-title">{tool.name}</div>
                    <button 
                      className={`btn btn-icon favorite-btn ${isFav ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite.mutate(tool.id);
                      }}
                      title={isFav ? "お気に入り解除" : "お気に入り登録"}
                      style={{ padding: '0.25rem', background: 'transparent' }}
                    >
                      <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="card-desc">{tool.description}</div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Main;
