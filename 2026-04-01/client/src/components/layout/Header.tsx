import type { TabType } from '../../types/form';

interface HeaderProps {
  mode: TabType;
  onModeChange: (mode: TabType) => void;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
}

export function Header({ mode, onModeChange, onSave, onLoad, onReset }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
            Prompt Forge
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onModeChange('simple')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                mode === 'simple'
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              簡易版
            </button>
            <button
              onClick={() => onModeChange('detailed')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                mode === 'detailed'
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              詳細版
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLoad}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            読み込み
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            保存
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="リセット"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
