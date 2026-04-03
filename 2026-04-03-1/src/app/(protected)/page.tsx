import Link from "next/link";

import { DemoDataButton } from "@/components/demo/DemoDataButton";
import { DailyFocus } from "@/components/focus/DailyFocus";
import { FocusPicker } from "@/components/focus/FocusPicker";
import { Header } from "@/components/layout/Header";
import { NoteCard } from "@/components/note/NoteCard";
import { getDailyFocus } from "@/lib/actions/focus";
import { getInboxPendingCount } from "@/lib/actions/inbox";
import { getRecentNotes } from "@/lib/actions/notes";
import { getActiveSprint } from "@/lib/actions/sprints";
import { listOpenTaskOptions, listProjects } from "@/lib/actions/tasks";
import { formatDateLabel, getTodayDate } from "@/lib/date";

export const dynamic = "force-dynamic";

function PlaceholderCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[--text-secondary]">{description}</p>
    </section>
  );
}

export default async function DashboardPage() {
  const today = getTodayDate();
  const [focusItems, inboxCount, taskOptions, projects, recentNotes, activeSprint] = await Promise.all([
    getDailyFocus(today),
    getInboxPendingCount(),
    listOpenTaskOptions(),
    listProjects(),
    getRecentNotes(3),
    getActiveSprint(),
  ]);

  return (
    <div className="space-y-8">
      <Header
        title="Dashboard"
        description="研究の作業開始画面です。今日は何を進めるか、今週の進み具合はどうかを最小限の情報で見渡せます。"
        actions={
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-2xl border border-[--border] bg-white px-4 py-3 text-right shadow-card">
              <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">Today</p>
              <p className="mt-1 text-lg font-medium text-[--text-primary]">{formatDateLabel(today)}</p>
            </div>
            <DemoDataButton compact />
          </div>
        }
      />

      {projects.length === 0 ? (
        <section className="soft-card">
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Getting Started</p>
          <h3 className="mt-2 text-2xl font-semibold text-[--text-primary]">まずは最初の research project を作成</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[--text-secondary]">
            Quick Capture で思いつきを残しつつ、Projects に 1 つ project を作って Epic から task へ分解すると使い始めやすいです。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <DemoDataButton />
            <Link
              href="/projects"
              className="rounded-xl bg-[--text-primary] px-4 py-2 text-sm font-medium text-white"
            >
              Projects を開く
            </Link>
            <Link
              href="/inbox"
              className="rounded-xl border border-[--border] px-4 py-2 text-sm text-[--text-secondary]"
            >
              Inbox を見る
            </Link>
          </div>
        </section>
      ) : null}

      <div className="page-grid">
        <div className="space-y-6">
          <DailyFocus date={today} items={focusItems} />
          <FocusPicker date={today} tasks={taskOptions} selected={focusItems} />
        </div>

        <div className="space-y-6">
          <section className="soft-card">
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Inbox</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">未処理のキャプチャ</h3>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-4xl font-semibold text-[--text-primary]">{inboxCount}</p>
                <p className="text-sm text-[--text-secondary]">まだ整理していないメモ</p>
              </div>
              <Link
                href="/inbox"
                className="rounded-xl border border-[--border] px-4 py-2 text-sm text-[--text-secondary]"
              >
                Inbox で整理する
              </Link>
            </div>
          </section>

          <section className="soft-card">
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Projects</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">進行中のプロジェクト</h3>
            <div className="mt-4 grid gap-3">
              {projects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-2xl bg-[--bg-secondary] px-4 py-3 transition hover:bg-[--bg-tertiary]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[--text-primary]">{project.name}</p>
                      <p className="text-sm text-[--text-secondary]">
                        未完了 {project.openTaskCount} / 全体 {project.taskCount}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[--text-secondary]">
                      {project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {recentNotes.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Notes</p>
                  <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">最近のメモ</h3>
                </div>
                <Link href="/notes" className="text-sm text-[--accent-blue]">
                  すべて見る
                </Link>
              </div>
              <div className="grid gap-4">
                {recentNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          ) : (
            <PlaceholderCard
              eyebrow="Notes"
              title="最近のメモ"
              description="Notes にメモを作ると、ここに直近の文脈が並びます。Inbox からメモ化した内容も後から育てられます。"
            />
          )}

          {activeSprint ? (
            <section className="soft-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Sprint</p>
                  <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">{activeSprint.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-[--text-secondary]">
                    {activeSprint.goal || "今週のゴールはまだ未設定です。"}
                  </p>
                </div>
                <Link href="/sprint" className="text-sm text-[--accent-blue]">
                  ボードを見る
                </Link>
              </div>

              <div className="mt-4 rounded-2xl bg-[--bg-secondary] p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[--text-secondary]">進捗</span>
                  <span className="font-medium text-[--text-primary]">
                    {activeSprint.done_tasks} / {activeSprint.total_tasks}
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[--accent-blue]"
                    style={{
                      width:
                        activeSprint.total_tasks === 0
                          ? "0%"
                          : `${Math.round((activeSprint.done_tasks / activeSprint.total_tasks) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </section>
          ) : (
            <PlaceholderCard
              eyebrow="Sprint"
              title="今週のスプリント管理"
              description="Sprint 画面から今週のゴールを決めて、Todo / In Progress / Done のボードで進められます。"
            />
          )}
        </div>
      </div>
    </div>
  );
}
