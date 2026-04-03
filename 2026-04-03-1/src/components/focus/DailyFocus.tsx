"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { completeFocus } from "@/lib/actions/focus";
import { formatDateLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { DailyFocusItem } from "@/types";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";

const STATUS_LABELS = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
} as const;

function FocusCompleteForm({
  item,
}: {
  item: DailyFocusItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  return (
    <form
      action={(formData) => {
        const reflection = String(formData.get("reflection") ?? "");

        setStatus("pending");
        setMessage("フォーカスを保存しています...");

        startTransition(async () => {
          try {
            await completeFocus(item.id, reflection);
            setStatus("success");
            setMessage("フォーカスを完了として記録しました。");
            router.refresh();
          } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "フォーカスの記録に失敗しました。");
          }
        });
      }}
      className="w-full max-w-md space-y-2"
    >
      <textarea
        name="reflection"
        defaultValue={item.reflection ?? ""}
        rows={2}
        placeholder="終えたら短い振り返りを残します"
        className="w-full rounded-2xl border border-[--border] bg-white px-3 py-2 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
      />
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={Boolean(item.completed) || isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
            item.completed
              ? "cursor-not-allowed bg-white text-[--text-secondary]"
              : "bg-[--text-primary] text-white hover:bg-black",
            isPending && "cursor-wait opacity-70"
          )}
        >
          {item.completed ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
          {item.completed ? "完了済み" : isPending ? "保存中..." : "完了として記録"}
        </button>
        <FeedbackMessage status={status} message={message} compact />
      </div>
    </form>
  );
}

export function DailyFocus({
  date,
  items,
}: {
  date: string;
  items: DailyFocusItem[];
}) {
  return (
    <section className="space-y-4 rounded-[28px] border border-[--border] bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Daily Focus</p>
          <h3 className="mt-2 text-2xl font-semibold text-[--text-primary]">今日のフォーカス</h3>
          <p className="mt-1 text-sm text-[--text-secondary]">{formatDateLabel(date)} の最大 3 件</p>
        </div>
        <div className="rounded-full bg-[--bg-secondary] px-3 py-1 text-sm text-[--text-secondary]">
          {items.length}/3
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[--border] bg-[--bg-secondary] px-5 py-8 text-sm leading-7 text-[--text-secondary]">
          まだ今日のフォーカスがありません。下のフォームから、今いちばん進めたい task を 3 件まで選べます。
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                "rounded-2xl border p-4 transition",
                item.completed
                  ? "border-[--status-done] bg-[--status-done]"
                  : "border-[--border] bg-[--bg-primary]"
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--bg-secondary] text-sm font-medium text-[--text-secondary]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">
                        {item.project_name}
                      </p>
                      <h4 className="text-lg font-medium text-[--text-primary]">{item.task_title}</h4>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[--text-secondary]">
                    <span className="rounded-full bg-[--bg-secondary] px-3 py-1">
                      {STATUS_LABELS[item.task_status]}
                    </span>
                    <Link
                      href={`/projects/${item.project_id}`}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-[--bg-secondary]"
                    >
                      <Link2 size={14} />
                      プロジェクトを見る
                    </Link>
                  </div>
                </div>

                <FocusCompleteForm item={item} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
