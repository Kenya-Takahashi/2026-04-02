import Link from "next/link";

import { formatDateTimeLabel } from "@/lib/date";
import type { NoteSummary } from "@/types";

export function NoteCard({ note }: { note: NoteSummary }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="rounded-[24px] border border-[--border] bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-[--accent-blue]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[--text-primary]">{note.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[--text-tertiary]">
            更新 {formatDateTimeLabel(note.updated_at)}
          </p>
        </div>
        <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary]">
          関連タスク {note.linked_task_count}
        </span>
      </div>

      <p className="mt-4 min-h-[4.5rem] whitespace-pre-wrap text-sm leading-7 text-[--text-secondary]">
        {note.preview}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {note.tags.length > 0 ? (
          note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary]"
            >
              #{tag}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-tertiary]">
            タグなし
          </span>
        )}
      </div>
    </Link>
  );
}
