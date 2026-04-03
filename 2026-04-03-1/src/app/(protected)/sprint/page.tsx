import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { SprintBoard } from "@/components/sprint/SprintBoard";
import { SprintCreateForm } from "@/components/sprint/SprintCreateForm";
import { formatDateLabel, getTodayDate } from "@/lib/date";
import {
  getActiveSprint,
  getSprintBoard,
  listSprints,
  updateSprintStatusAction,
} from "@/lib/actions/sprints";

export const dynamic = "force-dynamic";

function addDays(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + offset);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PlanningSprintList({
  sprints,
}: {
  sprints: Awaited<ReturnType<typeof listSprints>>;
}) {
  const planningSprints = sprints.filter((sprint) => sprint.status === "planning");

  if (planningSprints.length === 0) {
    return (
      <section className="soft-card">
        <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Planning</p>
        <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">開始待ちの sprint</h3>
        <p className="mt-3 text-sm leading-7 text-[--text-secondary]">
          まだ planning の sprint はありません。まずは 1 本つくって、必要な task を割り当ててから active にできます。
        </p>
      </section>
    );
  }

  return (
    <section className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Planning</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">開始待ちの sprint</h3>

      <div className="mt-5 grid gap-3">
        {planningSprints.map((sprint) => (
          <article key={sprint.id} className="rounded-2xl bg-[--bg-secondary] px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-[--text-primary]">{sprint.name}</p>
                <p className="text-sm text-[--text-secondary]">
                  {formatDateLabel(sprint.start_date)} - {formatDateLabel(sprint.end_date)}
                </p>
                <p className="mt-1 text-sm text-[--text-secondary]">
                  完了 {sprint.done_tasks} / 全体 {sprint.total_tasks}
                </p>
              </div>
              <form action={updateSprintStatusAction}>
                <input type="hidden" name="sprintId" value={sprint.id} />
                <input type="hidden" name="status" value="active" />
                <button
                  type="submit"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[--text-primary] transition hover:bg-[--bg-primary]"
                >
                  この sprint を開始
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function SprintPage() {
  const today = getTodayDate();
  const [activeSprint, sprints] = await Promise.all([getActiveSprint(), listSprints()]);
  const board = activeSprint ? await getSprintBoard(activeSprint.id) : null;
  const archivedSprints = sprints.filter(
    (sprint) => sprint.status === "review" || sprint.status === "completed"
  );

  return (
    <div className="space-y-8">
      <Header
        title="Sprint"
        description={
          activeSprint
            ? "今週の task を 3 列のボードで動かします。blocked は In Progress の中で強く表示し、Daily Focus にもそのまま追加できます。"
            : "まず sprint を 1 本作るか、planning 済みの sprint を active にして週の作業リズムを始めます。"
        }
        actions={
          activeSprint ? (
            <div className="rounded-2xl border border-[--border] bg-white px-4 py-3 text-right shadow-card">
              <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">Active Sprint</p>
              <p className="mt-1 text-lg font-medium text-[--text-primary]">{activeSprint.name}</p>
              <p className="text-sm text-[--text-secondary]">
                {activeSprint.done_tasks} / {activeSprint.total_tasks} 完了
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[--border] bg-white px-4 py-3 text-right shadow-card">
              <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">Status</p>
              <p className="mt-1 text-lg font-medium text-[--text-primary]">No Active Sprint</p>
              <p className="text-sm text-[--text-secondary]">まずは 1 本つくって始めましょう</p>
            </div>
          )
        }
      />

      {board ? (
        <SprintBoard board={board} />
      ) : (
        <section className="soft-card">
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Ready</p>
          <h3 className="mt-2 text-2xl font-semibold text-[--text-primary]">
            まだ active な sprint はありません
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[--text-secondary]">
            planning の sprint を開始するか、新しく作成してください。review は{" "}
            <Link href="/review" className="text-[--accent-blue]">
              Review
            </Link>
            {" "}画面から見返せます。
          </p>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <PlanningSprintList sprints={sprints} />
        </div>

        <div className="space-y-6">
          <SprintCreateForm defaultStartDate={today} defaultEndDate={addDays(today, 6)} />

          <section className="soft-card">
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Archive</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">review / completed</h3>

            <div className="mt-5 grid gap-3">
              {archivedSprints.length === 0 ? (
                <p className="text-sm leading-7 text-[--text-secondary]">
                  まだ review や completed の sprint はありません。動き始めたらここに履歴がたまります。
                </p>
              ) : (
                archivedSprints.slice(0, 5).map((sprint) => (
                  <Link
                    key={sprint.id}
                    href={`/review?sprintId=${sprint.id}`}
                    className="rounded-2xl bg-[--bg-secondary] px-4 py-4 transition hover:bg-[--bg-tertiary]"
                  >
                    <p className="font-medium text-[--text-primary]">{sprint.name}</p>
                    <p className="text-sm text-[--text-secondary]">
                      {sprint.status} · {sprint.done_tasks}/{sprint.total_tasks}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
