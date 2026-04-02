import { useEffect, useRef } from 'react';
import type { TemplateSummary } from '../../lib/api';

interface TemplateLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TemplateSummary[];
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TemplateLoadDialog({
  isOpen,
  onClose,
  templates,
  onLoad,
  onDelete,
}: TemplateLoadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/30 rounded-xl shadow-xl p-0 w-full max-w-lg"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">テンプレートを読み込み</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            保存済みのテンプレートはありません
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-1">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-700 truncate">{t.name}</div>
                  <div className="text-xs text-gray-400">
                    {t.tab_type === 'simple' ? '簡易版' : '詳細版'} ・ {formatDate(t.updated_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => {
                      onLoad(t.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    読み込む
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`「${t.name}」を削除しますか？`)) {
                        onDelete(t.id);
                      }
                    }}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </dialog>
  );
}
