"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { addTaskToFocus } from "@/lib/actions/focus";
import { createTask, moveTaskAction, updateTaskStatus } from "@/lib/actions/tasks";
import { getTodayDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { TaskLevel, TaskStatus, TaskTreeNode } from "@/types";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string; className: string }> = [
  { value: "todo", label: "Todo", className: "bg-[--status-todo]" },
  { value: "in_progress", label: "In Progress", className: "bg-[--status-progress]" },
  { value: "done", label: "Done", className: "bg-[--status-done]" },
  { value: "blocked", label: "Blocked", className: "bg-[--status-blocked]" },
];

function AddTaskForm({
  projectId,
  parentId,
  level,
  label,
}: {
  projectId: string;
  parentId?: string;
  level: TaskLevel;
  label: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  return (
    <form
      ref={formRef}
      action={(formData) => {
        const title = String(formData.get("title") ?? "");
        const description = String(formData.get("description") ?? "");

        setStatus("pending");
        setMessage(`${label} を追加しています...`);

        startTransition(async () => {
          try {
            await createTask({
              projectId,
              parentId,
              level,
              title,
              description,
            });
            formRef.current?.reset();
            setStatus("success");
            setMessage(`${label} を追加しました。`);
            router.refresh();
          } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "タスクの追加に失敗しました。");
          }
        });
      }}
      className="mt-3 grid gap-2 rounded-2xl border border-dashed border-[--border] bg-[--bg-secondary] p-3"
    >
      <div className="text-sm font-medium text-[--text-primary]">{label}</div>
      <input
        name="title"
        placeholder={`${level.toUpperCase()} のタイトル`}
        className="rounded-xl border border-[--border] bg-white px-3 py-2 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="必要なら補足説明を残す"
        className="rounded-xl border border-[--border] bg-white px-3 py-2 text-sm text-[--text-primary] outline-none placeholder:text-[--text-tertiary] focus:border-[--accent-blue]"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FeedbackMessage status={status} message={message} compact />
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium text-white",
            isPending ? "cursor-wait bg-[--text-secondary]" : "bg-[--text-primary]"
          )}
        >
          {isPending ? "追加中..." : "追加"}
        </button>
      </div>
    </form>
  );
}

function TaskNodeView({ node }: { node: TaskTreeNode }) {
  const childLevel = node.level === "epic" ? "story" : node.level === "story" ? "task" : null;
  const today = getTodayDate();
  const router = useRouter();
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
        setMessage(error instanceof Error ? error.message : "操作に失敗しました。");
      }
    });
  };

  return (
    <li className="rounded-[24px] border border-[--border] bg-white p-4 shadow-card">
      <details open={node.level !== "task"}>
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[--text-secondary]">
                  {node.level}
                </span>
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      runAction(
                        "ステータスを更新しています...",
                        "ステータスを更新しました。",
                        () => updateTaskStatus(node.id, option.value)
                      );
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs transition",
                      node.status === option.value
                        ? `${option.className} text-[--text-primary]`
                        : "bg-[--bg-secondary] text-[--text-secondary] hover:bg-[--bg-tertiary]",
                      isPending && "cursor-wait opacity-70"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                <Link
                  href={`/notes?taskId=${node.id}`}
                  className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary] hover:bg-[--bg-tertiary]"
                >
                  関連メモ {node.note_count}
                </Link>
              </div>
              <div>
                <h4 className="text-lg font-medium text-[--text-primary]">{node.title}</h4>
                {node.description ? (
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[--text-secondary]">
                    {node.description}
                  </p>
                ) : null}
              </div>
              <FeedbackMessage status={status} message={message} compact />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault();
                  runAction(
                    "今日のフォーカスへ追加しています...",
                    "今日のフォーカスへ追加しました。",
                    () => addTaskToFocus(today, node.id)
                  );
                }}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm transition",
                  node.is_in_daily_focus
                    ? "bg-[--status-done] text-[--text-primary]"
                    : "bg-[--bg-secondary] text-[--text-secondary] hover:bg-[--bg-tertiary]",
                  isPending && "cursor-wait opacity-70"
                )}
              >
                {node.is_in_daily_focus ? "今日のフォーカス済み" : "今日のフォーカスへ"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault();
                  const formData = new FormData();
                  formData.set("taskId", node.id);
                  formData.set("direction", "up");
                  runAction("並び順を更新しています...", "並び順を更新しました。", () => moveTaskAction(formData));
                }}
                className="rounded-xl bg-[--bg-secondary] px-3 py-2 text-sm text-[--text-secondary]"
              >
                ↑ 上へ
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault();
                  const formData = new FormData();
                  formData.set("taskId", node.id);
                  formData.set("direction", "down");
                  runAction("並び順を更新しています...", "並び順を更新しました。", () => moveTaskAction(formData));
                }}
                className="rounded-xl bg-[--bg-secondary] px-3 py-2 text-sm text-[--text-secondary]"
              >
                ↓ 下へ
              </button>
            </div>
          </div>
        </summary>

        {childLevel ? (
          <AddTaskForm
            projectId={node.project_id}
            parentId={node.id}
            level={childLevel}
            label={`${childLevel.toUpperCase()} を追加`}
          />
        ) : null}

        {node.children.length > 0 ? (
          <ul className="mt-4 grid gap-3 border-l border-dashed border-[--border] pl-4">
            {node.children.map((child) => (
              <TaskNodeView key={child.id} node={child} />
            ))}
          </ul>
        ) : childLevel ? (
          <p className="mt-4 text-sm text-[--text-tertiary]">まだ下位のタスクはありません。</p>
        ) : (
          <div className="mt-4 rounded-2xl bg-[--bg-secondary] px-4 py-3 text-sm text-[--text-secondary]">
            最下層レベルの task です。必要なら関連メモを残したり、後から順番を調整できます。
          </div>
        )}
      </details>
    </li>
  );
}

export function TaskTree({
  projectId,
  nodes,
}: {
  projectId: string;
  nodes: TaskTreeNode[];
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-[--border] bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Task Breakdown</p>
        <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">Epic から分解を始める</h3>
        <AddTaskForm projectId={projectId} level="epic" label="新しい Epic を追加" />
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[--border] bg-white px-6 py-10 text-sm leading-7 text-[--text-secondary]">
          まだタスクツリーがありません。最初の Epic を 1 つ作ると、そこから Story と Task に分解できます。
        </div>
      ) : (
        <ul className="grid gap-4">
          {nodes.map((node) => (
            <TaskNodeView key={node.id} node={node} />
          ))}
        </ul>
      )}
    </section>
  );
}
