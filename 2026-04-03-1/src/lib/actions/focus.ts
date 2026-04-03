"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getTodayDate } from "@/lib/date";
import { getDb } from "@/lib/db";
import type { DailyFocusItem } from "@/types";

function revalidateFocusPaths(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/sprint");
  revalidatePath("/review");

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  } else {
    revalidatePath("/projects");
  }
}

export async function getDailyFocus(date: string): Promise<DailyFocusItem[]> {
  const user = await requireUser();
  const db = getDb();

  return db
    .prepare(
      `SELECT
         df.id,
         df.user_id,
         df.date,
         df.task_id,
         df.sort_order,
         df.completed,
         df.reflection,
         t.title AS task_title,
         t.status AS task_status,
         p.id AS project_id,
         p.name AS project_name
       FROM daily_focus df
       INNER JOIN tasks t ON t.id = df.task_id AND t.user_id = df.user_id
       INNER JOIN projects p ON p.id = t.project_id AND p.user_id = df.user_id
       WHERE df.user_id = ? AND df.date = ?
       ORDER BY df.sort_order ASC, df.id ASC`
    )
    .all(user.id, date) as DailyFocusItem[];
}

export async function setDailyFocus(date: string, taskIds: string[]): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const uniqueIds = Array.from(new Set(taskIds.filter(Boolean)));

  if (uniqueIds.length > 3) {
    throw new Error("Daily Focus は 3 件までです。");
  }

  if (uniqueIds.length > 0) {
    const ownedTasks = db
      .prepare(
        `SELECT id
         FROM tasks
         WHERE user_id = ? AND id IN (${uniqueIds.map(() => "?").join(", ")})`
      )
      .all(user.id, ...uniqueIds) as Array<{ id: string }>;

    if (ownedTasks.length !== uniqueIds.length) {
      throw new Error("フォーカスに追加できないタスクが含まれています。");
    }
  }

  const existing = db
    .prepare("SELECT task_id FROM daily_focus WHERE user_id = ? AND date = ?")
    .all(user.id, date) as Array<{ task_id: string }>;

  db.transaction(() => {
    if (uniqueIds.length === 0) {
      db.prepare("DELETE FROM daily_focus WHERE user_id = ? AND date = ?").run(user.id, date);
      return;
    }

    db.prepare(
      `DELETE FROM daily_focus
       WHERE user_id = ?
         AND date = ?
         AND task_id NOT IN (${uniqueIds.map(() => "?").join(", ")})`
    ).run(user.id, date, ...uniqueIds);

    const insert = db.prepare(
      `INSERT OR IGNORE INTO daily_focus (user_id, date, task_id, sort_order)
       VALUES (?, ?, ?, ?)`
    );
    const update = db.prepare(
      `UPDATE daily_focus
       SET sort_order = ?
       WHERE user_id = ? AND date = ? AND task_id = ?`
    );

    uniqueIds.forEach((taskId, index) => {
      if (existing.some((item) => item.task_id === taskId)) {
        update.run(index, user.id, date, taskId);
      } else {
        insert.run(user.id, date, taskId, index);
      }
    });
  })();

  revalidateFocusPaths();
}

export async function setDailyFocusAction(formData: FormData) {
  const date = String(formData.get("date") ?? getTodayDate());
  const taskIds = [formData.get("taskId1"), formData.get("taskId2"), formData.get("taskId3")]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  await setDailyFocus(date, taskIds);
}

export async function addTaskToFocus(date: string, taskId: string): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const task = db
    .prepare("SELECT project_id FROM tasks WHERE id = ? AND user_id = ?")
    .get(taskId, user.id) as { project_id: string } | undefined;

  if (!task) {
    throw new Error("フォーカス対象のタスクが見つかりません。");
  }

  const countRow = db
    .prepare("SELECT COUNT(*) AS total FROM daily_focus WHERE user_id = ? AND date = ?")
    .get(user.id, date) as { total: number };

  const already = db
    .prepare("SELECT id FROM daily_focus WHERE user_id = ? AND date = ? AND task_id = ?")
    .get(user.id, date, taskId) as { id: string } | undefined;

  if (!already && countRow.total >= 3) {
    throw new Error("Daily Focus は 3 件までです。");
  }

  if (!already) {
    db.prepare(
      `INSERT INTO daily_focus (user_id, date, task_id, sort_order)
       VALUES (
         ?,
         ?,
         ?,
         (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM daily_focus WHERE user_id = ? AND date = ?)
       )`
    ).run(user.id, date, taskId, user.id, date);
  }

  revalidateFocusPaths(task.project_id);
}

export async function addTaskToFocusAction(formData: FormData) {
  await addTaskToFocus(
    String(formData.get("date") ?? getTodayDate()),
    String(formData.get("taskId") ?? "")
  );
}

export async function completeFocus(focusId: string, reflection?: string): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const focus = db
    .prepare(
      `SELECT df.id, df.task_id, t.project_id, t.title
       FROM daily_focus df
       INNER JOIN tasks t ON t.id = df.task_id AND t.user_id = df.user_id
       WHERE df.id = ? AND df.user_id = ?`
    )
    .get(focusId, user.id) as { id: string; task_id: string; project_id: string; title: string } | undefined;

  if (!focus) {
    throw new Error("フォーカス項目が見つかりません。");
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE daily_focus
       SET completed = 1, reflection = COALESCE(?, reflection)
       WHERE id = ? AND user_id = ?`
    ).run(reflection?.trim() || null, focusId, user.id);

    db.prepare(
      `INSERT INTO activity_log (user_id, type, ref_id, description)
       VALUES (?, 'focus_completed', ?, ?)`
    ).run(user.id, focus.task_id, focus.title);
  })();

  revalidateFocusPaths(focus.project_id);
}

export async function completeFocusAction(formData: FormData) {
  await completeFocus(
    String(formData.get("focusId") ?? ""),
    String(formData.get("reflection") ?? "")
  );
}
