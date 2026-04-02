import { useState, useEffect, useRef } from 'react';

interface TemplateSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onSaveAs: (name: string) => void;
  currentTemplateId: number | null;
  defaultName?: string;
}

export function TemplateSaveDialog({
  isOpen,
  onClose,
  onSave,
  onSaveAs,
  currentTemplateId,
  defaultName = '',
}: TemplateSaveDialogProps) {
  const [name, setName] = useState(defaultName);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setName(defaultName);
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen, defaultName]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  const handleSaveAs = () => {
    if (!name.trim()) return;
    onSaveAs(name.trim());
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/30 rounded-xl shadow-xl p-0 w-full max-w-md"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">テンプレートを保存</h2>
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">テンプレート名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="例: ECサイト基本構成"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          {currentTemplateId && (
            <button
              onClick={handleSaveAs}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              名前を付けて保存
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {currentTemplateId ? '上書き保存' : '保存'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
