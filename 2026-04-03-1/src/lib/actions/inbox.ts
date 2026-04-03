"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createNote } from "@/lib/actions/notes";
import { createTask, getProject } from "@/lib/actions/tasks";
import { getDb } from "@/lib/db";
import { buildNoteTitle, splitTags, trimOrNull } from "@/lib/utils";
import type { InboxItem, Task } from "@/types";

export type CaptureInboxFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submissionKey: number;
};

function revalidateInboxPaths(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/inbox");

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

function getInboxItem(userId: string, itemId: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM inbox WHERE id = ? AND user_id = ?")
    .get(itemId, userId) as InboxItem | undefined;
}

function getUniqueInboxNoteTitle(userId: string, baseTitle: string) {
  const db = getDb();
  const safeBaseTitle = baseTitle.trim() || "新規メモ";
  let candidate = safeBaseTitle;
  let suffix = 2;

  while (
    db.prepare(
      `SELECT id
       FROM notes
       WHERE user_id = ? AND title = ? COLLATE NOCASE
       LIMIT 1`
    ).get(userId, candidate) as { id: string } | undefined
  ) {
    candidate = `${safeBaseTitle} (${suffix})`;
    suffix += 1;
  }

  return candidate;
}

export async function captureToInbox(data: {
  content: string;
  source?: string;
}): Promise<InboxItem> {
  const user = await requireUser();
  const db = getDb();
  const content = data.content.trim();

  if (!content) {
    throw new Error("キャプチャ内容を入力してください。");
  }

  db.prepare(
    `INSERT INTO inbox (user_id, content, source)
     VALUES (?, ?, ?)`
  ).run(user.id, content, trimOrNull(data.source));

  const item = db
    .prepare("SELECT * FROM inbox WHERE rowid = last_insert_rowid()")
    .get() as InboxItem | undefined;

  if (!item) {
    throw new Error("Inbox への追加に失敗しました。");
  }

  revalidateInboxPaths();
  return item;
}

export async function captureToInboxAction(formData: FormData) {
  await captureToInbox({
    content: String(formData.get("content") ?? ""),
    source: String(formData.get("source") ?? ""),
  });
}

export async function captureToInboxFormAction(
  previousState: CaptureInboxFormState,
  formData: FormData
): Promise<CaptureInboxFormState> {
  try {
    await captureToInbox({
      content: String(formData.get("content") ?? ""),
      source: String(formData.get("source") ?? ""),
    });

    return {
      status: "success",
      message: "Inbox に追加しました。",
      submissionKey: previousState.submissionKey + 1,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Inbox への追加に失敗しました。",
      submissionKey: previousState.submissionKey + 1,
    };
  }
}

export async function listInboxItems(): Promise<{ pending: InboxItem[]; processed: InboxItem[] }> {
  const user = await requireUser();
  const db = getDb();
  const items = db
    .prepare("SELECT * FROM inbox WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as InboxItem[];

  return {
    pending: items.filter((item) => item.processed === 0),
    processed: items.filter((item) => item.processed === 1),
  };
}

export async function getInboxPendingCount(): Promise<number> {
  const user = await requireUser();
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM inbox WHERE user_id = ? AND processed = 0")
    .get(user.id) as { total: number };

  return row.total;
}

export async function processInboxItem(
  itemId: string,
  action: {
    type: "to_task" | "to_note" | "trash";
    projectId?: string;
    parentTaskId?: string;
    tags?: string[];
  }
): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const item = getInboxItem(user.id, itemId);

  if (!item) {
    throw new Error("Inbox 項目が見つかりません。");
  }

  if (item.processed) {
    return;
  }

  let processedTo: InboxItem["processed_to"] = null;
  let processedRef: string | null = null;
  let projectIdForRefresh: string | undefined;

  if (action.type === "to_task") {
    const projectId = action.projectId?.trim();

    if (!projectId) {
      throw new Error("タスク化するにはプロジェクトを選択してください。");
    }

    const project = await getProject(projectId);

    if (!project) {
      throw new Error("プロジェクトが見つかりません。");
    }

    const parentTask = action.parentTaskId
      ? (db
          .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
          .get(action.parentTaskId, user.id) as Task | undefined)
      : undefined;

    if (parentTask && parentTask.project_id !== projectId) {
      throw new Error("親タスクは同じプロジェクトから選んでください。");
    }

    const level = !parentTask ? "epic" : parentTask.level === "epic" ? "story" : "task";
    const task = await createTask({
      projectId,
      parentId: parentTask?.id,
      level,
      title: item.content,
      description: item.source ?? undefined,
    });

    processedTo = "task";
    processedRef = task.id;
    projectIdForRefresh = projectId;
  }

  if (action.type === "to_note") {
    const note = await createNote({
      title: getUniqueInboxNoteTitle(user.id, buildNoteTitle(item.content)),
      content: item.source ? `# Source\n${item.source}\n\n# Capture\n${item.content}` : item.content,
      tags: action.tags ?? [],
    });

    processedTo = "note";
    processedRef = note.id;
  }

  if (action.type === "trash") {
    processedTo = "trash";
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE inbox
       SET processed = 1, processed_to = ?, processed_ref = ?
       WHERE id = ? AND user_id = ?`
    ).run(processedTo, processedRef, itemId, user.id);

    db.prepare(
      `INSERT INTO activity_log (user_id, type, ref_id, description)
       VALUES (?, 'inbox_processed', ?, ?)`
    ).run(user.id, itemId, `${processedTo ?? "unknown"}: ${item.content}`);
  })();

  revalidateInboxPaths(projectIdForRefresh);
}

export async function processInboxItemAction(formData: FormData) {
  await processInboxItem(String(formData.get("itemId") ?? ""), {
    type: String(formData.get("type") ?? "") as "to_task" | "to_note" | "trash",
    projectId: trimOrNull(formData.get("projectId")) ?? undefined,
    parentTaskId: trimOrNull(formData.get("parentTaskId")) ?? undefined,
    tags: splitTags(trimOrNull(formData.get("tags")) ?? undefined),
  });
}
