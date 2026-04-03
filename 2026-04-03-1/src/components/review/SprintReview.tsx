"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateSprintRetro, updateSprintStatus } from "@/lib/actions/sprints";
import { formatDateLabel } from "@/lib/date";
import type { SprintSummary } from "@/types";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { cn } from "@/lib/utils";

function StatusButton({
  label,
  onClick,
  isPending,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  isPending: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={cn(
        "rounded-xl px-4 py-2 text-sm transition",
        primary
          ? "bg-[--text-primary] font-medium text-white hover:bg-black"
          : "border border-[--border] text-[--text-secondary] hover:bg-[--bg-secondary]",
        isPending && "cursor-wait opacity-70"
      )}
    >
      {isPending ? "更新中..." : label}
    </button>
  );
}

export function SprintReview({ sprint }: { sprint: SprintSummary }) {
  const router = useRouter();
  const progress =
    sprint.total_tasks === 0 ? 0 : Math.round((sprint.done_tasks / sprint.total_tasks) * 100);
  const [retroNote, setRetroNote] = useState(sprint.retro_note ?? "");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const runAction = (pendingMessage: string, successMessage: string, action: () => Promise<void>) => {
    setStatus("pending");
    setMessage(pendingMessage);

    startTransition(async () => {
      try {
        await action();
        setStatus("success");
        setMessage(successMessage);
        router.refresh();
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Sprint の更新に失敗しました。");
      }
    });
  };

  return (
    <section className="soft-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Sprint Review</p>
          <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">{sprint.name}</h3>
          <p className="mt-2 text-sm leading-7 text-[--text-secondary]">
            {formatDateLabel(sprint.start_date)} から {formatDateLabel(sprint.end_date)} まで
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sprint.status === "active" ? (
            <>
              <StatusButton
                label="Review に進める"
                isPending={isPending}
                onClick={() =>
                  runAction("スプリントを review に進めています...", "スプリントを review に進めました。", () =>
                    updateSprintStatus(sprint.id, "review")
                  )
                }
              />
              <StatusButton
                label="Completed にする"
                primary
                isPending={isPending}
                onClick={() =>
                  runAction("スプリントを完了しています...", "スプリントを completed にしました。", () =>
                    updateSprintStatus(sprint.id, "completed")
                  )
                }
              />
            </>
          ) : null}

          {sprint.status === "review" ? (
            <>
              <StatusButton
                label="Active に戻す"
                isPending={isPending}
                onClick={() =>
                  runAction("スプリントを active に戻しています...", "スプリントを active に戻しました。", () =>
                    updateSprintStatus(sprint.id, "active")
                  )
                }
              />
              <StatusButton
                label="Completed にする"
                primary
                isPending={isPending}
                onClick={() =>
                  runAction("スプリントを完了しています...", "スプリントを completed にしました。", () =>
                    updateSprintStatus(sprint.id, "completed")
                  )
                }
              />
            </>
          ) : null}

          {sprint.status === "planning" ? (
            <StatusButton
              label="この sprint を開始"
              primary
              isPending={isPending}
              onClick={() =>
                runAction("スプリントを開始しています...", "スプリントを active にしました。", () =>
                  updateSprintStatus(sprint.id, "active")
                )
              }
            />
          ) : null}

          {sprint.status === "completed" ? (
            <div className="rounded-xl bg-[--status-done] px-4 py-2 text-sm text-[--text-primary]">
              完了済みの sprint です
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[--bg-secondary] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[--text-primary]">ゴール</p>
            <p className="mt-1 text-sm text-[--text-secondary]">
              {sprint.goal || "この sprint にはまだ goal が設定されていません。"}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm text-[--text-secondary]">
            {sprint.status}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[--text-secondary]">達成度</span>
            <span className="font-medium text-[--text-primary]">
              {sprint.done_tasks} / {sprint.total_tasks} ({progress}%)
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[--accent-blue]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[--text-primary]">振り返りメモ</span>
          <textarea
            value={retroNote}
            onChange={(event) => setRetroNote(event.target.value)}
            rows={6}
            placeholder="うまく進んだこと、詰まったこと、次週に活かしたいこと"
            className="rounded-2xl border border-[--border] bg-[--bg-primary] px-4 py-3 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FeedbackMessage status={status} message={message} />
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runAction("振り返りを保存しています...", "振り返りを保存しました。", () =>
                updateSprintRetro(sprint.id, retroNote)
              )
            }
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition",
              isPending ? "cursor-wait bg-[--text-secondary]" : "bg-[--text-primary] hover:bg-black"
            )}
          >
            {isPending ? "保存中..." : "振り返りを保存"}
          </button>
        </div>
      </div>
    </section>
  );
}
