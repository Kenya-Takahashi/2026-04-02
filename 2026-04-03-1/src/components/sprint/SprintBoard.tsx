"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { addTaskToFocus } from "@/lib/actions/focus";
import { assignTasksToSprint, removeTaskFromSprint, updateSprintStatus } from "@/lib/actions/sprints";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { getTodayDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { SprintBoardCard, SprintBoardData, TaskStatus } from "@/types";

const COLUMNS: Array<{
  key: "todo" | "in_progress" | "done";
  title: string;
  description: string;
  targetStatus: TaskStatus;
  tone: string;
}> = [
  {
    key: "todo",
    title: "Todo",
    description: "まだ着手していないタスク",
    targetStatus: "todo",
    tone: "bg-[--status-todo]",
  },
  {
    key: "in_progress",
    title: "In Progress",
    description: "進行中。blocked もここに残します",
    targetStatus: "in_progress",
    tone: "bg-[--status-progress]",
  },
  {
    key: "done",
    title: "Done",
    description: "完了したタスク",
    targetStatus: "done",
    tone: "bg-[--status-done]",
  },
];

function getContextLabel(task: SprintBoardCard) {
  const parts = [task.ancestor_title, task.parent_title].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "文脈なし";
}

function getMoveTargets(status: TaskStatus) {
  if (status === "todo") {
    return ["in_progress", "done"] as const;
  }

  if (status === "done") {
    return ["in_progress", "todo"] as const;
  }

  return ["todo", "done"] as const;
}

function TaskCard({
  task,
  onMove,
  onToggleBlocked,
  onAddToFocus,
  onRemove,
  busyTaskId,
}: {
  task: SprintBoardCard;
  onMove: (taskId: string, status: TaskStatus) => void;
  onToggleBlocked: (task: SprintBoardCard) => void;
  onAddToFocus: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  busyTaskId: string | null;
}) {
  const moveTargets = getMoveTargets(task.status);
  const isBusy = busyTaskId === task.id;

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-[24px] border p-4 shadow-card transition",
        task.status === "blocked"
          ? "border-[--accent-coral] bg-[--status-blocked]"
          : "border-[--border] bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-[--bg-secondary] p-2 text-[--text-tertiary]">
            <GripVertical size={14} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">{task.project_name}</p>
            <h4 className="mt-1 text-base font-semibold text-[--text-primary]">{task.title}</h4>
            <p className="mt-1 text-sm text-[--text-secondary]">{getContextLabel(task)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-xs text-[--text-secondary]">
            P{task.priority}
          </span>
          {task.status === "blocked" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-[--accent-coral]">
              <AlertTriangle size={12} />
              Blocked
            </span>
          ) : null}
          {task.is_in_daily_focus ? (
            <span className="rounded-full bg-[--status-done] px-3 py-1 text-xs text-[--text-primary]">
              Focus
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onAddToFocus(task.id)}
          disabled={isBusy || task.is_in_daily_focus}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
            task.is_in_daily_focus
              ? "cursor-default bg-[--status-done] text-[--text-primary]"
              : "bg-[--bg-secondary] text-[--text-secondary] hover:bg-[--bg-tertiary]",
            isBusy && "cursor-wait opacity-70"
          )}
        >
          <Sparkles size={14} />
          {task.is_in_daily_focus ? "今日の Focus 済み" : "今日の Focus に追加"}
        </button>

        <button
          type="button"
          onClick={() => onToggleBlocked(task)}
          disabled={isBusy || task.status === "done"}
          className={cn(
            "rounded-xl px-3 py-2 text-sm transition",
            task.status === "blocked"
              ? "bg-white text-[--accent-coral]"
              : "bg-[--status-blocked] text-[--accent-coral]",
            (isBusy || task.status === "done") && "cursor-wait opacity-70"
          )}
        >
          {task.status === "blocked" ? "Blocked を解除" : "Blocked にする"}
        </button>

        <button
          type="button"
          onClick={() => onRemove(task.id)}
          disabled={isBusy}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-[--bg-secondary] px-3 py-2 text-sm text-[--text-secondary] transition hover:bg-[--bg-tertiary]",
            isBusy && "cursor-wait opacity-70"
          )}
        >
          <Trash2 size={14} />
          Sprint から外す
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {moveTargets.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onMove(task.id, status)}
            disabled={isBusy}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-[--bg-secondary] px-3 py-1 text-[--text-secondary] transition hover:bg-[--bg-tertiary]",
              isBusy && "cursor-wait opacity-70"
            )}
          >
            {status === "todo" ? <ArrowUp size={12} /> : status === "done" ? <CheckCircle2 size={12} /> : <ArrowDown size={12} />}
            {status === "todo" ? "Todo" : status === "done" ? "Done" : "In Progress"}
          </button>
        ))}
        {task.note_count > 0 ? (
          <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-[--text-secondary]">
            関連メモ {task.note_count}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function SprintBoard({ board }: { board: SprintBoardData }) {
  const router = useRouter();
  const today = useMemo(() => getTodayDate(), []);
  const [message, setMessage] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [isPending, startTaskTransition] = useTransition();

  const runTaskAction = (taskId: string, action: () => Promise<void>, successMessage: string) => {
    setBusyTaskId(taskId);
    setMessage("");

    startTaskTransition(async () => {
      try {
        await action();
        setMessage(successMessage);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "操作に失敗しました。");
      } finally {
        setBusyTaskId(null);
      }
    });
  };

  const handleDrop = (targetStatus: TaskStatus, taskId: string) => {
    runTaskAction(taskId, () => updateTaskStatus(taskId, targetStatus), "ステータスを更新しました。");
  };

  const handleAssign = (taskId: string) => {
    runTaskAction(
      taskId,
      () => assignTasksToSprint(board.sprint.id, [taskId]),
      "スプリントにタスクを追加しました。"
    );
  };

  const handleMove = (taskId: string, status: TaskStatus) => {
    runTaskAction(taskId, () => updateTaskStatus(taskId, status), "ステータスを更新しました。");
  };

  const handleToggleBlocked = (task: SprintBoardCard) => {
    const nextStatus = task.status === "blocked" ? "in_progress" : "blocked";
    runTaskAction(task.id, () => updateTaskStatus(task.id, nextStatus), "タスクの状態を更新しました。");
  };

  const handleAddToFocus = (taskId: string) => {
    runTaskAction(taskId, () => addTaskToFocus(today, taskId), "今日の Focus に追加しました。");
  };

  const handleRemove = (taskId: string) => {
    runTaskAction(
      taskId,
      () => removeTaskFromSprint(board.sprint.id, taskId),
      "スプリントからタスクを外しました。"
    );
  };

  const handleAdvanceSprint = (status: "review" | "completed") => {
    setMessage("");
    startTaskTransition(async () => {
      try {
        await updateSprintStatus(board.sprint.id, status);
        setMessage(status === "review" ? "スプリントを review に進めました。" : "スプリントを完了にしました。");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "スプリントの更新に失敗しました。");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="soft-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Sprint Board</p>
            <h3 className="mt-2 text-2xl font-semibold text-[--text-primary]">{board.sprint.name}</h3>
            <p className="mt-2 text-sm leading-7 text-[--text-secondary]">
              {board.sprint.goal || "今週のゴールはまだ未設定です。"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAdvanceSprint("review")}
              disabled={isPending}
              className="rounded-xl border border-[--border] px-4 py-2 text-sm text-[--text-secondary] transition hover:bg-[--bg-secondary] disabled:cursor-wait disabled:opacity-70"
            >
              Review に進める
            </button>
            <button
              type="button"
              onClick={() => handleAdvanceSprint("completed")}
              disabled={isPending}
              className="rounded-xl bg-[--text-primary] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-70"
            >
              スプリント完了
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[--bg-secondary] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[--text-primary]">進捗</p>
              <p className="text-sm text-[--text-secondary]">
                完了 {board.sprint.done_tasks} / 全体 {board.sprint.total_tasks}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm text-[--text-secondary]">
              {board.sprint.status}
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[--accent-blue] transition-all"
              style={{
                width:
                  board.sprint.total_tasks === 0
                    ? "0%"
                    : `${Math.round((board.sprint.done_tasks / board.sprint.total_tasks) * 100)}%`,
              }}
            />
          </div>
        </div>

        {message ? (
          <p className="mt-4 text-sm text-[--accent-teal]">{message}</p>
        ) : (
          <p className="mt-4 text-sm text-[--text-secondary]">
            ドラッグ&ドロップ、またはカード内のボタンで status を動かせます。
          </p>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const tasks = board[column.key];

          return (
            <section
              key={column.key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = event.dataTransfer.getData("text/plain");

                if (taskId) {
                  handleDrop(column.targetStatus, taskId);
                }
              }}
              className="rounded-[28px] border border-[--border] bg-white p-5 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full", column.tone)} />
                    <h4 className="text-lg font-semibold text-[--text-primary]">{column.title}</h4>
                  </div>
                  <p className="mt-1 text-sm text-[--text-secondary]">{column.description}</p>
                </div>
                <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-sm text-[--text-secondary]">
                  {tasks.length}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[--border] bg-[--bg-secondary] px-4 py-6 text-sm leading-7 text-[--text-secondary]">
                    この列にはまだタスクがありません。
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={handleMove}
                      onToggleBlocked={handleToggleBlocked}
                      onAddToFocus={handleAddToFocus}
                      onRemove={handleRemove}
                      busyTaskId={busyTaskId}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className="soft-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[--text-tertiary]">Backlog</p>
            <h3 className="mt-2 text-xl font-semibold text-[--text-primary]">未割り当てタスク</h3>
            <p className="mt-1 text-sm text-[--text-secondary]">
              sprint にまだ入っていない task レベルの項目です。
            </p>
          </div>
          <span className="rounded-full bg-[--bg-secondary] px-3 py-1 text-sm text-[--text-secondary]">
            {board.unassigned_tasks.length}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {board.unassigned_tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[--border] bg-[--bg-secondary] px-4 py-6 text-sm leading-7 text-[--text-secondary]">
              追加できる未割り当て task はありません。Projects から task を作るとここに出てきます。
            </div>
          ) : (
            board.unassigned_tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-2xl bg-[--bg-secondary] px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[--text-tertiary]">{task.project_name}</p>
                  <p className="mt-1 font-medium text-[--text-primary]">{task.title}</p>
                  <p className="text-sm text-[--text-secondary]">{getContextLabel(task)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAssign(task.id)}
                  disabled={busyTaskId === task.id}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-[--text-primary] transition hover:bg-[--bg-primary]",
                    busyTaskId === task.id && "cursor-wait opacity-70"
                  )}
                >
                  <Plus size={14} />
                  この sprint に追加
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
