import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSession, useUpdateSession } from "../hooks/useSessions";
import { useCreatePresentation, useDeletePresentation } from "../hooks/usePresentation";
import { PresentationView } from "../components/presentation/PresentationView";

export function SessionPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const { data: session, isLoading } = useSession(sessionId);
  const updateSession = useUpdateSession();
  const createPresentation = useCreatePresentation(sessionId);
  const deletePresentation = useDeletePresentation(sessionId);
  const [activeTab, setActiveTab] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        読み込み中...
      </div>
    );
  }

  if (!session) return null;

  const presentations = session.presentations;
  const current = presentations[activeTab];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{session.date}</span>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                updateSession.mutate({
                  id: sessionId,
                  title: titleDraft || undefined,
                });
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="text-lg font-semibold bg-transparent border-b-2 border-blue-400 focus:outline-none px-1"
            />
          ) : (
            <h2
              className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => {
                setTitleDraft(session.title || "");
                setEditingTitle(true);
              }}
            >
              {session.title || "タイトル未設定"}
            </h2>
          )}
        </div>
      </div>

      {/* Presentation Tabs */}
      <div className="border-b border-gray-200 px-6 flex items-center gap-1 overflow-x-auto">
        {presentations.map((p, i) => (
          <div key={p.id} className={`group flex items-center border-b-2 transition-colors ${
                i === activeTab
                  ? "border-blue-500"
                  : "border-transparent"
              }`}>
            <button
              onClick={() => setActiveTab(i)}
              className={`pl-4 pr-1 py-2.5 text-sm whitespace-nowrap transition-colors ${
                i === activeTab
                  ? "text-blue-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.studentName || "名前未設定"}
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm(`${p.studentName}の発表を削除しますか？`)) {
                  await deletePresentation.mutateAsync(p.id);
                  setActiveTab((prev) =>
                    prev >= presentations.length - 1
                      ? Math.max(0, prev - 1)
                      : prev
                  );
                }
              }}
              className={`w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 hover:text-red-500 text-xs mr-1 transition-all ${
                i === activeTab
                  ? "text-blue-400"
                  : "text-gray-300 opacity-0 group-hover:opacity-100"
              }`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={async () => {
            await createPresentation.mutateAsync({
              studentName: `発表者${presentations.length + 1}`,
            });
            setActiveTab(presentations.length);
          }}
          className="px-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Presentation Content */}
      <div className="flex-1 overflow-y-auto">
        {current ? (
          <PresentationView
            key={current.id}
            presentation={current}
            sessionId={sessionId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>「+」をクリックして発表者を追加してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
