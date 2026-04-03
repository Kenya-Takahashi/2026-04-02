import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { NoteCreateForm } from "@/components/note/NoteCreateForm";
import { NoteCard } from "@/components/note/NoteCard";
import { TagFilter } from "@/components/note/TagFilter";
import { listTags, searchNotes } from "@/lib/actions/notes";
import { listTaskOptions } from "@/lib/actions/tasks";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams?: { q?: string; tag?: string; taskId?: string };
}) {
  const query = searchParams?.q?.trim() ?? "";
  const selectedTag = searchParams?.tag?.trim() ?? "";
  const taskId = searchParams?.taskId?.trim() ?? "";

  const [notes, tags, tasks] = await Promise.all([
    searchNotes({
      text: query || undefined,
      tags: selectedTag ? [selectedTag] : [],
      taskId: taskId || undefined,
    }),
    listTags(),
    listTaskOptions(),
  ]);

  const selectedTask = taskId ? tasks.find((task) => task.id === taskId) : null;

  return (
    <div className="space-y-8">
      <Header
        title="Notes"
        description="研究中の気づきや仮説を、あとで再利用できる文脈として育てていきます。"
        actions={
          <div className="rounded-2xl border border-[--border] bg-white px-4 py-3 text-right shadow-card">
            <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">Results</p>
            <p className="mt-1 text-lg font-medium text-[--text-primary]">{notes.length} notes</p>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-6">
          <NoteCreateForm />

          <section className="soft-card">
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}
              {taskId ? <input type="hidden" name="taskId" value={taskId} /> : null}
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="タイトルや本文を検索"
                className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
              />
              <button
                type="submit"
                className="rounded-2xl bg-[--text-primary] px-5 py-3 text-sm font-medium text-white"
              >
                検索
              </button>
            </form>

            {(selectedTag || taskId || query) && (
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {selectedTag ? (
                  <span className="rounded-full bg-[--status-progress] px-3 py-1 text-[--text-primary]">
                    タグ: #{selectedTag}
                  </span>
                ) : null}
                {selectedTask ? (
                  <span className="rounded-full bg-[--status-done] px-3 py-1 text-[--text-primary]">
                    タスク: {selectedTask.title}
                  </span>
                ) : null}
                {query ? (
                  <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-[--text-secondary]">
                    検索: {query}
                  </span>
                ) : null}
                <Link
                  href="/notes"
                  className="rounded-full border border-[--border] px-3 py-1 text-[--text-secondary]"
                >
                  フィルターを解除
                </Link>
              </div>
            )}
          </section>

          {notes.length === 0 ? (
            <section className="soft-card">
              <p className="text-sm leading-7 text-[--text-secondary]">
                条件に合うメモはまだありません。新しいメモを作るか、Inbox からメモ化して育てていけます。
              </p>
            </section>
          ) : (
            <section className="grid gap-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <TagFilter
            tags={tags}
            selectedTag={selectedTag || undefined}
            query={query || undefined}
            taskId={taskId || undefined}
          />

          <section className="soft-card">
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Context Tips</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">つながりを残すコツ</h3>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-[--text-secondary]">
              <li>タイトルはあとから検索しやすい言葉にすると再利用しやすいです。</li>
              <li>`[[既存タイトル]]` を使うと、ノート同士のつながりを残せます。</li>
              <li>関連タスクを紐付けると、Projects 側からも文脈へ戻れます。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
