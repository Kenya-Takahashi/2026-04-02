"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { type NoteFormState, updateNoteFormAction } from "@/lib/actions/notes";
import { formatDateTimeLabel } from "@/lib/date";
import type { NoteDetail, TaskOption } from "@/types";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";

const initialState: NoteFormState = {
  status: "idle",
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[--text-primary] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-wait disabled:bg-[--text-secondary]"
    >
      {pending ? "保存中..." : "保存する"}
    </button>
  );
}

function groupTasksByProject(tasks: TaskOption[]) {
  return tasks.reduce<Record<string, TaskOption[]>>((groups, task) => {
    if (!groups[task.project_name]) {
      groups[task.project_name] = [];
    }

    groups[task.project_name].push(task);
    return groups;
  }, {});
}

export function NoteEditor({
  note,
  taskOptions,
}: {
  note: NoteDetail;
  taskOptions: TaskOption[];
}) {
  const [state, formAction] = useFormState(updateNoteFormAction, initialState);
  const router = useRouter();
  const groupedTasks = groupTasksByProject(taskOptions);
  const linkedTaskIds = new Set(note.linked_tasks.map((task) => task.id));

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
      <section className="soft-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Note Editor</p>
            <h3 className="mt-2 text-2xl font-semibold text-[--text-primary]">{note.title}</h3>
          </div>
          <div className="text-right text-sm text-[--text-secondary]">
            <p>更新 {formatDateTimeLabel(note.updated_at)}</p>
            <p>作成 {formatDateTimeLabel(note.created_at)}</p>
          </div>
        </div>

        <form action={formAction} className="mt-6 grid gap-4">
          <input type="hidden" name="noteId" value={note.id} />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[--text-primary]">タイトル</span>
            <input
              name="title"
              defaultValue={note.title}
              className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[--text-primary]">タグ</span>
            <input
              name="tags"
              defaultValue={note.tags.join(", ")}
              className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[--text-primary]">本文</span>
            <textarea
              name="content"
              defaultValue={note.content}
              rows={18}
              className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 font-mono text-sm leading-7 text-[--text-primary] outline-none focus:border-[--accent-blue]"
            />
          </label>

          <div className="rounded-2xl bg-[--bg-secondary] p-4">
            <p className="text-sm font-medium text-[--text-primary]">関連タスク</p>
            <p className="mt-1 text-sm leading-6 text-[--text-secondary]">
              必要なタスクだけを選ぶと、Projects 側からも文脈へ戻りやすくなります。
            </p>
            <div className="mt-4 grid gap-4">
              {Object.keys(groupedTasks).length === 0 ? (
                <p className="text-sm text-[--text-secondary]">まだタスクがありません。</p>
              ) : (
                Object.entries(groupedTasks).map(([projectName, tasks]) => (
                  <div key={projectName} className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-medium text-[--text-primary]">{projectName}</p>
                    <div className="mt-3 grid gap-2">
                      {tasks.map((task) => (
                        <label key={task.id} className="flex items-start gap-3 text-sm text-[--text-secondary]">
                          <input
                            type="checkbox"
                            name="linkedTaskIds"
                            value={task.id}
                            defaultChecked={linkedTaskIds.has(task.id)}
                            className="mt-1"
                          />
                          <span>
                            <span className="font-medium text-[--text-primary]">{task.title}</span>
                            <span className="ml-2 text-xs uppercase tracking-[0.14em] text-[--text-tertiary]">
                              {task.level}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-[--text-secondary]">
                `[[既存タイトル]]` を含めて保存すると、解決済みリンクが右側に反映されます。
              </p>
              <FeedbackMessage
                status={state.status === "idle" ? "info" : state.status}
                message={state.message || "保存すると Notes 一覧と関連タスク側にも反映されます。"}
              />
            </div>
            <SaveButton />
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <section className="soft-card">
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Resolved Links</p>
          <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">解決済みリンク</h3>
          <div className="mt-4 grid gap-2">
            {note.resolved_links.length === 0 ? (
              <p className="text-sm text-[--text-secondary]">まだ解決済みのリンクはありません。</p>
            ) : (
              note.resolved_links.map((link) => (
                <Link
                  key={link.id}
                  href={`/notes/${link.id}`}
                  className="rounded-2xl bg-[--bg-secondary] px-4 py-3 text-sm text-[--text-primary] transition hover:bg-[--bg-tertiary]"
                >
                  [[{link.title}]]
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="soft-card">
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Unresolved</p>
          <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">未解決リンク</h3>
          <div className="mt-4 grid gap-2">
            {note.unresolved_titles.length === 0 ? (
              <p className="text-sm text-[--text-secondary]">未解決のタイトルはありません。</p>
            ) : (
              note.unresolved_titles.map((title) => (
                <div
                  key={title}
                  className="rounded-2xl bg-[--status-blocked] px-4 py-3 text-sm text-[--accent-coral]"
                >
                  [[{title}]] はまだ存在しません
                </div>
              ))
            )}
          </div>
        </section>

        <section className="soft-card">
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Task Context</p>
          <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">紐付け済みタスク</h3>
          <div className="mt-4 grid gap-2">
            {note.linked_tasks.length === 0 ? (
              <p className="text-sm text-[--text-secondary]">まだ関連タスクはありません。</p>
            ) : (
              note.linked_tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project_id}`}
                  className="rounded-2xl bg-[--bg-secondary] px-4 py-3 text-sm transition hover:bg-[--bg-tertiary]"
                >
                  <span className="font-medium text-[--text-primary]">{task.title}</span>
                  <span className="ml-2 text-[--text-secondary]">({task.project_name})</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
