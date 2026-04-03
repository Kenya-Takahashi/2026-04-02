import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ToolDetailProps {
  username: string;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ username }) => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: tool, isLoading } = useQuery({
    queryKey: ['tool', slug],
    queryFn: async () => {
      const res = await apiFetch(`/tools/${slug}`);
      if (!res.ok) throw new Error('Not found');
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
  if (!tool) return <div>Tool not found</div>;

  const isFav = favorites?.includes(tool.id);

  return (
    <div>
      <Link to="/" className="btn mb-4" style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', opacity: 0.8 }}>
        <ArrowLeft size={16} /> 戻る
      </Link>
      
      <div className="flex items-center justify-between mb-4">
        <h1>{tool.name}</h1>
        <button 
          className={`btn flex items-center gap-2 favorite-btn ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite.mutate(tool.id)}
          title={isFav ? "お気に入り解除" : "お気に入り登録"}
        >
          <Heart size={20} fill={isFav ? "currentColor" : "none"} />
          <span>{isFav ? "お気に入り済み" : "お気に入り登録"}</span>
        </button>
      </div>

      <img src={tool.image_path} alt={tool.name} className="hero-image" />

      <p className="page-description">{tool.description}</p>

      <h2>特徴・概要</h2>
      <p>
        <strong>キャラクター:</strong> {tool.character_name} ({tool.animal_type})<br />
        <strong>カテゴリ:</strong> {tool.category}
      </p>

      {tool.slug === 'claude-code' && (
        <>
          <p>Claude Code は、Anthropic社が提供するターミナルネイティブな画期的AIコーディングエージェントです。単なるコードのサジェストにとどまらず、プロジェクト全体を自律的に理解し、テストの実行、複数ファイルにまたがるリファクタリング、シェルの操作までを一手に引き受けます。</p>
          <div className="code-block">
            $ npm install -g @anthropic-ai/claude-code<br />
            $ claude
          </div>
          <h3>主な特徴</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>エージェンティックな進行:</strong> 要件を伝えるだけで、どのような手順で作業するかを計画・実行・評価します。</li>
            <li><strong>ターミナル直結:</strong> デベロッパーにとって慣れ親しんだCLIに常駐し、GUIとブラウザを行き来する手間を省きます。</li>
            <li><strong>エージェントチーム (プレビュー):</strong> 複数のエージェントが協調して大規模なコードレビューを実施する先進的な機能も研究されています。</li>
          </ul>
          <h3>注意点</h3>
          <p>自律的にファイルを変更しコマンドを実行する強力な権限を持つため、出力結果はチームメイトの Pull Request をレビューするのと同じように、必ず人間が確認（Human-in-the-loop）することが推奨されています。</p>
        </>
      )}

      {tool.slug === 'openclaw' && (
        <>
          <p>OpenClaw は、ローカル環境で稼働するオープンソースの完全自律型AIアシスタントです。初期の公開からコミュニティの手によって爆発的な進化を遂げ、実世界の「JARVIS」とも呼ばれています。</p>
          <div className="code-block">
            $ git clone https://github.com/example/openclaw.git<br />
            $ cd openclaw && npm install<br />
            $ npm start
          </div>
          <h3>主な特徴</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>モデル・アグノスティック:</strong> Claude, GPT, GeminiなどのAPIから、Ollamaを使ったローカル推論まで、好きなLLMを頭脳として採用できます。</li>
            <li><strong>高い拡張性 (Skills):</strong> AgentSkills という仕組みを使い、カレンダーへのアクセスやツール連携、テスト自動化など、自由に能力を拡張できます。</li>
            <li><strong>プライバシー優先:</strong> 履歴やログはすべてローカル領域に保存され、外部システムへの意図しないデータ漏洩を防ぎます。</li>
          </ul>
          <h3>セキュリティ</h3>
          <p>システムに対してシェルコマンド実行などのフルアクセスを持つため、普段使いのPCではなく、Dockerコンテナなどの隔離されたサンドボックス環境内での実行が強く推奨されます。</p>
        </>
      )}

      {tool.slug === 'docker' && (
        <>
          <p>Docker は、軽量なコンテナ型の仮想環境を提供するインフラストラクチャ技術です。Agentic Coding においては、AIが安全に実行されるための「サンドボックス（箱庭）」として非常に重要な役割を担います。</p>
          <div className="code-block">
            version: '3.8'<br />
            services:<br />
            &nbsp;&nbsp;agent-env:<br />
            &nbsp;&nbsp;&nbsp;&nbsp;image: ubuntu:latest<br />
            &nbsp;&nbsp;&nbsp;&nbsp;command: /bin/bash
          </div>
          <h3>Agentic Coding との関わり</h3>
          <p>OpenClaw のような自律型エージェントにローカルマシンの root 権限を与えてしまうと、誤ってシステムを破壊したり、セキュリティ上のリスクが生じる可能性があります。そこで、使い捨てのコンテナ内にエージェントを閉じ込めて作業させることで、開発基盤の安全性を強力に担保します。</p>
        </>
      )}
      
      {tool.slug === 'ubuntu' && (
        <>
          <p>Ubuntu は、人間とAIがともに活用する世界標準とも言える Linux ディストリビューションです。サーバーサイドでの実績が高く、多くのAIツールの動作検証は Ubuntu ベースの環境で行われます。</p>
          <h3>Agentic Coding との関わり</h3>
          <p>エージェントがコマンドを実行する際、「シェルスクリプトを書いてシステムを構築する」「apt-get を用いて新しいライブラリをインストールする」といった行動のベース環境として、最もエラーが少なく、コミュニティ情報も豊富なため安定して利用されます。</p>
        </>
      )}

      {tool.slug === 'linux' && (
        <>
          <p>Linux はすべてのシステムとインフラの基盤となる OS カーネルです。サーバー、コンテナ、多くの開発環境がこの上で動作しています。</p>
          <h3>Agentic Coding との関わり</h3>
          <p>Agentic コーディングにおけるエージェントたちは、本質的にこの Linux という海を泳ぐことになります。ファイルのパーミッション、プロセス管理、ネットワークの設定など、エージェントが複雑な開発環境を組み立てるためには Linux の仕組みへの深いアプローチが欠かせません。</p>
        </>
      )}

      {tool.slug === 'codex' && (
        <>
          <p>Codex は、OpenAIが提供するクラウドネイティブな高度AIコーディングエージェントです。ソフトウェアエンジニアのコラボレーティブ・パートナーとして設計されています。</p>
          <h3>主な特徴</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>コンテキストに強い開発:</strong> コマンドラインやエディタの枠を超え、複数ファイルやシステム全体のアーキテクチャを理解した広範なリファクタリングが可能です。</li>
            <li><strong>クラウドネイティブ:</strong> 開発マシンのスペックに制限されず、安全な隔離クラウド環境でタスクをこなしたり、GitHub を通じて直接 Pull Request のレビューなどを行います。</li>
            <li><strong>MCPサーバー統合:</strong> Model Context Protocol などのエコシステムと連携し、組織固有のワークフローや社内ツールに合わせた開発を進める支援も行います。</li>
          </ul>
        </>
      )}

      {tool.slug === 'antigravity' && (
        <>
          <p>Antigravity は、次代の Web 開発の常識を文字通り「覆す」ために生み出された、マルチモーダル対応の強力な Agentic Coding ツールです。</p>
          <h3>主な特徴</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>マルチモーダル機能:</strong> 優れた画像生成AIなどとネイティブに統合されており、ソースコードの生成だけでなく、プロンプトベースで直接画像アセットを生成し、アプリ内に配置するといったクリエイティブな作業までを代行します。</li>
            <li><strong>総合的な自動化:</strong> 従来のコードアシストの壁を超え、アイデア出しやデザインのモックアップから詳細な実装、テストに至るまでのライフサイクル全体を、重力に縛られずに駆け抜けます。</li>
          </ul>
        </>
      )}

    </div>
  );
};

export default ToolDetail;
