import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton';

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            プレビュー
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              viewMode === 'raw'
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Markdown
          </button>
        </div>
        <CopyButton text={markdown} />
      </div>
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-5">
        {viewMode === 'preview' ? (
          <div className="prose prose-sm prose-gray max-w-none prose-headings:text-gray-800 prose-h1:text-lg prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-h2:text-base prose-h3:text-sm prose-table:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
            {markdown}
          </pre>
        )}
      </div>
    </div>
  );
}
