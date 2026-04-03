import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { SprintReview } from "@/components/review/SprintReview";
import { WeeklyChart } from "@/components/review/WeeklyChart";
import { formatDateLabel } from "@/lib/date";
import { getReviewSummary, listSprints } from "@/lib/actions/sprints";

export const dynamic = "force-dynamic";

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-[--text-primary]">{value}</p>
      <p className="mt-2 text-sm text-[--text-secondary]">{helper}</p>
    </article>
  );
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: { sprintId?: string };
}) {
  const selectedSprintId = searchParams?.sprintId?.trim() || undefined;
  const [summary, sprints] = await Promise.all([
    getReviewSummary(selectedSprintId),
    listSprints(),
  ]);

  if (!summary.sprint) {
    return (
      <div className="space-y-8">
        <Header
          title="Review"
          description="activity_log を週ごとに見返して、完了した task と残った文脈を振り返ります。"
        />

        <section className="soft-card">
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">No Data</p>
          <h3 className="mt-2 text-2xl font-semibold text-[--text-primary]">
            振り返れる sprint がまだありません
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[--text-secondary]">
            まずは{" "}
            <Link href="/sprint" className="text-[--accent-blue]">
              Sprint
            </Link>
            {" "}画面で active な sprint を作ると、ここに review がたまっていきます。
          </p>
        </section>
      </div>
    );
  }

  const otherSprints = sprints.filter((sprint) => sprint.id !== summary.sprint?.id);

  return (
    <div className="space-y-8">
      <Header
        title="Review"
        description="週の終わりに、goal と activity の流れを見ながら振り返りを残します。active な sprint があればそれを、なければ直近の sprint を表示します。"
        actions={
          <div className="rounded-2xl border border-[--border] bg-white px-4 py-3 text-right shadow-card">
            <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">Selected Sprint</p>
            <p className="mt-1 text-lg font-medium text-[--text-primary]">{summary.sprint.name}</p>
            <p className="text-sm text-[--text-secondary]">
              {formatDateLabel(summary.sprint.start_date)} - {formatDateLabel(summary.sprint.end_date)}
            </p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Tasks Done"
          value={summary.completed_task_count}
          helper={`Sprint 内で完了した task: ${summary.sprint.done_tasks}/${summary.sprint.total_tasks}`}
        />
        <SummaryCard
          label="Notes"
          value={summary.note_count}
          helper="この期間に作成したメモ"
        />
        <SummaryCard
          label="Inbox"
          value={summary.inbox_processed_count}
          helper="処理して流した inbox 件数"
        />
        <SummaryCard
          label="Focus"
          value={summary.focus_completed_count}
          helper="Daily Focus を完了した回数"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <SprintReview sprint={summary.sprint} />
          <WeeklyChart activity={summary.activity_by_day} />
        </div>

        <aside className="space-y-6">
          <section className="soft-card">
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">History</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">過去 sprint</h3>
            <div className="mt-5 grid gap-3">
              {otherSprints.length === 0 ? (
                <p className="text-sm leading-7 text-[--text-secondary]">
                  まだほかの sprint はありません。
                </p>
              ) : (
                otherSprints.map((sprint) => (
                  <Link
                    key={sprint.id}
                    href={`/review?sprintId=${sprint.id}`}
                    className="rounded-2xl bg-[--bg-secondary] px-4 py-4 transition hover:bg-[--bg-tertiary]"
                  >
                    <p className="font-medium text-[--text-primary]">{sprint.name}</p>
                    <p className="text-sm text-[--text-secondary]">
                      {sprint.status} · {sprint.done_tasks}/{sprint.total_tasks}
                    </p>
                    <p className="mt-1 text-sm text-[--text-secondary]">
                      {formatDateLabel(sprint.start_date)} - {formatDateLabel(sprint.end_date)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="soft-card">
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Next Step</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">続きの導線</h3>
            <div className="mt-4 grid gap-3 text-sm text-[--text-secondary]">
              <Link
                href="/sprint"
                className="rounded-2xl bg-[--bg-secondary] px-4 py-3 transition hover:bg-[--bg-tertiary]"
              >
                Sprint board に戻る
              </Link>
              <Link
                href="/projects"
                className="rounded-2xl bg-[--bg-secondary] px-4 py-3 transition hover:bg-[--bg-tertiary]"
              >
                Projects で task を見直す
              </Link>
              <Link
                href="/notes"
                className="rounded-2xl bg-[--bg-secondary] px-4 py-3 transition hover:bg-[--bg-tertiary]"
              >
                Notes で学びを残す
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
