"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { processInboxItem } from "@/lib/actions/inbox";
import { formatDateTimeLabel } from "@/lib/date";
import type { InboxItem as InboxItemType, ProjectSummary, TaskOption } from "@/types";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { cn } from "@/lib/utils";

function parentTaskLabel(task: TaskOption) {
  return `[${task.project_name}] ${task.level.toUpperCase()} / ${task.title}`;
}

export function InboxItem({
  item,
  projects,
  taskOptions,
}: {
  item: InboxItemType;
  projects: ProjectSummary[];
  taskOptions: TaskOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [tags, setTags] = useState("");

  const parentTaskChoices = useMemo(
    () =>
      taskOptions.filter((task) => {
        if (task.level === "task") {
          return false;
        }

        if (!selectedProjectId) {
          return true;
        }

        return task.project_id === selectedProjectId;
      }),
    [selectedProjectId, taskOptions]
  );

  const runAction = (
    nextAction: {
      type: "to_task" | "to_note" | "trash";
      projectId?: string;
      parentTaskId?: string;
      tags?: string[];
    },
    pendingMessage: string,
    successMessage: string
  ) => {
    setStatus("pending");
    setMessage(pendingMessage);

    startTransition(async () => {
      try {
        await processInboxItem(item.id, nextAction);
        setStatus("success");
        setMessage(successMessage);
        router.refresh();
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Inbox の処理に失敗しました。");
      }
    });
  };

  return (
    <article className="rounded-[24px] border border-[--border] bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">
            {formatDateTimeLabel(item.created_at)}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-[--text-primary]">
            {item.content}
          </p>
          {item.source ? (
            <p className="mt-2 text-sm text-[--text-secondary]">source: {item.source}</p>
          ) : null}
          {item.processed ? (
            <p className="mt-3 text-sm text-[--accent-teal]">
              処理済み: {item.processed_to}
              {item.processed_ref && item.processed_to === "task" ? (
                <>
                  {" · "}
                  <Link className="underline" href="/projects">
                    関連タスクを見る
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="mt-3">
            <FeedbackMessage status={status} message={message} />
          </div>
        </div>

        {!item.processed ? (
          <div className="grid w-full gap-3 lg:max-w-md">
            <section className="grid gap-2 rounded-2xl bg-[--bg-secondary] p-3">
              <div>
                <p className="text-sm font-medium text-[--text-primary]">タスクに変換</p>
                <p className="text-xs text-[--text-secondary]">
                  親タスクがなければ Epic として作成されます。
                </p>
              </div>
              <select
                value={selectedProjectId}
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                  setParentTaskId("");
                }}
                className="rounded-xl border border-[--border] bg-white px-3 py-2 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
              >
                <option value="">プロジェクトを選択</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={parentTaskId}
                onChange={(event) => setParentTaskId(event.target.value)}
                className="rounded-xl border border-[--border] bg-white px-3 py-2 text-sm text-[--text-primary] outline-none focus:border-[--accent-blue]"
              >
                <option value="">親タスクなし / Epic として作成</option>
                {parentTaskChoices.map((task) => (
                  <option key={task.id} value={task.id}>
                    {parentTaskLabel(task)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    {
                      type: "to_task",
                      projectId: selectedProjectId || undefined,
                      parentTaskId: parentTaskId || undefined,
                    },
                    "タスクへ変換しています...",
                    "Inbox をタスクへ変換しました。"
                  )
                }
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium text-white",
                  isPending ? "cursor-wait bg-[--text-secondary]" : "bg-[--text-primary]"
                )}
              >
                {isPending ? "処理中..." : "タスク化する"}
              </button>
            </section>

            <section className="grid gap-2 rounded-2xl bg-[--bg-secondary] p-3">
              <div>
                <p className="text-sm font-medium text-[--text-primary]">メモに変換</p>
                <p className="text-xs text-[--text-secondary]">タグはカンマ区切りで追加できます。</p>
              </div>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="例: 文献, 次に読む, アイデア"
                className="rounded-xl border border-[--border] bg-white px-3 py-2 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    {
                      type: "to_note",
                      tags: tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    },
                    "メモへ変換しています...",
                    "Inbox をメモへ変換しました。"
                  )
                }
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium text-[--text-primary]",
                  isPending ? "cursor-wait bg-white/70" : "bg-white"
                )}
              >
                {isPending ? "処理中..." : "メモ化する"}
              </button>
            </section>

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                runAction(
                  { type: "trash" },
                  "Inbox を破棄しています...",
                  "Inbox を破棄しました。"
                )
              }
              className={cn(
                "rounded-xl border border-[--border] bg-white px-4 py-2 text-sm text-[--text-secondary]",
                isPending && "cursor-wait opacity-70"
              )}
            >
              不要として破棄
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
