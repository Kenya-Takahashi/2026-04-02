import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (data: { date: string; title?: string }) => void;
}

export function NewSessionDialog({ onClose, onCreate }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-80">
        <h2 className="text-base font-semibold mb-4">新しいセッション</h2>
        <label className="block text-sm text-gray-600 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <label className="block text-sm text-gray-600 mb-1">タイトル (任意)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 第3回ゼミ"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            キャンセル
          </button>
          <button
            onClick={() => onCreate({ date, title: title || undefined })}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}
