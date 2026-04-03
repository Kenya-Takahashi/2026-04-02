import { InboxItem } from "@/components/focus/InboxItem";
import { Header } from "@/components/layout/Header";
import { listInboxItems } from "@/lib/actions/inbox";
import { listProjects, listTaskOptions } from "@/lib/actions/tasks";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const [{ pending, processed }, projects, taskOptions] = await Promise.all([
    listInboxItems(),
    listProjects(),
    listTaskOptions(),
  ]);

  return (
    <div className="space-y-8">
      <Header
        title="Inbox"
        description="思いついたことを一度ここへ集め、必要に応じて task・note・破棄へ流していきます。"
      />

      {pending.length === 0 ? (
        <section className="soft-card">
          <p className="text-sm leading-7 text-[--text-secondary]">
            未処理の Inbox はありません。下部の Quick Capture から、あとで整理したいメモをいつでも追加できます。
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[--text-primary]">未処理アイテム</h3>
            <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-sm text-[--text-secondary]">
              {pending.length} 件
            </span>
          </div>
          <div className="grid gap-4">
            {pending.map((item) => (
              <InboxItem key={item.id} item={item} projects={projects} taskOptions={taskOptions} />
            ))}
          </div>
        </section>
      )}

      <section className="soft-card">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[--text-primary]">処理済み</h3>
          <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-sm text-[--text-secondary]">
            {processed.length} 件
          </span>
        </div>
        {processed.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-[--text-secondary]">まだ処理済みの履歴はありません。</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {processed.map((item) => (
              <InboxItem key={item.id} item={item} projects={projects} taskOptions={taskOptions} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
