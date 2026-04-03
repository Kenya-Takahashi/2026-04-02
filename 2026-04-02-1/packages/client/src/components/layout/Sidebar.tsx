import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSessions, useCreateSession, useDeleteSession } from "../../hooks/useSessions";
import { NewSessionDialog } from "../session/NewSessionDialog";
import { WorkflowPage } from "../../pages/WorkflowPage";

export function Sidebar() {
  const { id } = useParams();
  const activeId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { data: sessions } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);

  return (
    <aside className="w-60 h-full border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800 tracking-tight">
            卒論ゼミノート
          </h1>
          <button
            onClick={() => setWorkflowOpen(true)}
            className="px-2 py-1 text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
          >
            ワークフロー
          </button>
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          + 新しいセッション
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions?.map((s) => (
          <div
            key={s.id}
            className={`group relative px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-colors ${
              activeId === s.id
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => navigate(`/sessions/${s.id}`)}
          >
            <div className="text-sm font-medium">{s.date}</div>
            {s.title && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">{s.title}</div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("このセッションを削除しますか？")) {
                  deleteSession.mutate(s.id);
                  if (activeId === s.id) navigate("/");
                }
              }}
              className="absolute right-2 top-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              ×
            </button>
          </div>
        ))}
      </nav>

      {dialogOpen && (
        <NewSessionDialog
          onClose={() => setDialogOpen(false)}
          onCreate={async (data) => {
            const session = await createSession.mutateAsync(data);
            navigate(`/sessions/${session.id}`);
            setDialogOpen(false);
          }}
        />
      )}

      {workflowOpen && <WorkflowPage onClose={() => setWorkflowOpen(false)} />}
    </aside>
  );
}
