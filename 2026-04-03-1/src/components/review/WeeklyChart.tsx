import { formatShortDateLabel } from "@/lib/date";
import type { ActivityByDay } from "@/types";

export function WeeklyChart({ activity }: { activity: ActivityByDay[] }) {
  const maxTotal = Math.max(...activity.map((item) => item.total), 1);

  return (
    <section className="soft-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Activity</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">日別アクティビティ</h3>
      <p className="mt-1 text-sm text-[--text-secondary]">
        task / notes / inbox / focus の動きを、日ごとの件数でざっくり確認できます。
      </p>

      <div className="mt-5 grid gap-3">
        {activity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[--border] bg-[--bg-secondary] px-4 py-6 text-sm text-[--text-secondary]">
            まだこの期間の activity はありません。
          </div>
        ) : (
          activity.map((item) => (
            <div key={item.date} className="rounded-2xl bg-[--bg-secondary] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">
                    {formatShortDateLabel(`${item.date}T00:00:00`)}
                  </p>
                  <p className="text-xs text-[--text-secondary]">
                    task {item.task_done_count} / note {item.note_created_count} / inbox {item.inbox_processed_count} / focus {item.focus_completed_count}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm text-[--text-secondary]">
                  {item.total}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[--accent-blue]"
                  style={{ width: `${Math.max(8, Math.round((item.total / maxTotal) * 100))}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
