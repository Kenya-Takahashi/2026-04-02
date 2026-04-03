"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setDailyFocus } from "@/lib/actions/focus";
import type { DailyFocusItem, TaskOption } from "@/types";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { cn } from "@/lib/utils";

function selectedTaskId(items: DailyFocusItem[], index: number) {
  return items[index]?.task_id ?? "";
}

export function FocusPicker({
  date,
  tasks,
  selected,
}: {
  date: string;
  tasks: TaskOption[];
  selected: DailyFocusItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  return (
    <section className="rounded-[28px] border border-[--border] bg-white p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Pick Three</p>
      <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">今日のフォーカスを選ぶ</h3>
      <p className="mt-1 text-sm leading-7 text-[--text-secondary]">
        まだ終わっていない task から、今日はここまで進めたい 3 件を選びます。
      </p>

      <form
        action={(formData) => {
          const taskIds = [formData.get("taskId1"), formData.get("taskId2"), formData.get("taskId3")]
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .map((value) => value.trim());

          setStatus("pending");
          setMessage("今日のフォーカスを保存しています...");

          startTransition(async () => {
            try {
              await setDailyFocus(date, taskIds);
              setStatus("success");
              setMessage("今日のフォーカスを更新しました。");
              router.refresh();
            } catch (error) {
              setStatus("error");
              setMessage(error instanceof Error ? error.message : "フォーカスの更新に失敗しました。");
            }
          });
        }}
        className="mt-5 grid gap-4"
      >
        {[0, 1, 2].map((index) => (
          <label key={index} className="grid gap-2">
            <span className="text-sm font-medium text-[--text-primary]">フォーカス {index + 1}</span>
            <select
              name={`taskId${index + 1}`}
              defaultValue={selectedTaskId(selected, index)}
              className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
            >
              <option value="">未選択</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  [{task.project_name}] {task.title}
                </option>
              ))}
            </select>
          </label>
        ))}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FeedbackMessage status={status} message={message} />
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition",
              isPending ? "cursor-wait bg-[--text-secondary]" : "bg-[--accent-blue] hover:opacity-90"
            )}
          >
            {isPending ? "保存中..." : "今日の 3 件を更新"}
          </button>
        </div>
      </form>
    </section>
  );
}
