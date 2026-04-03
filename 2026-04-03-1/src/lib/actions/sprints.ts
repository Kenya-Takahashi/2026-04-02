"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getTodayDate } from "@/lib/date";
import { getDb } from "@/lib/db";
import { trimOrNull } from "@/lib/utils";
import type {
  ActivityByDay,
  ReviewSummary,
  Sprint,
  SprintBoardCard,
  SprintBoardData,
  SprintStatus,
  SprintSummary,
  Task,
} from "@/types";

type SprintBoardRow = Omit<SprintBoardCard, "is_in_daily_focus"> & {
  is_in_daily_focus: number;
};

export type SprintFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

function makePlaceholders(length: number) {
  return new Array(length).fill("?").join(", ");
}

function revalidateSprintPaths(projectIds: string[] = []) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/sprint");
  revalidatePath("/review");

  Array.from(new Set(projectIds)).forEach((projectId) => {
    revalidatePath(`/projects/${projectId}`);
  });
}

function getSprintSummarySelect(whereClause = "") {
  return `SELECT
      s.*,
      COUNT(DISTINCT st.task_id) AS total_tasks,
      SUM(CASE WHEN t.id IS NOT NULL AND t.status = 'done' THEN 1 ELSE 0 END) AS done_tasks
    FROM sprints s
    LEFT JOIN sprint_tasks st ON st.sprint_id = s.id
    LEFT JOIN tasks t ON t.id = st.task_id AND t.user_id = s.user_id
    ${whereClause}
    GROUP BY s.id`;
}

function getSprintRowById(userId: string, sprintId: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM sprints WHERE id = ? AND user_id = ?")
    .get(sprintId, userId) as Sprint | undefined;
}

function getSprintSummaryById(userId: string, sprintId: string) {
  const db = getDb();
  return db
    .prepare(`${getSprintSummarySelect("WHERE s.user_id = ? AND s.id = ?")} LIMIT 1`)
    .get(userId, sprintId) as SprintSummary | undefined;
}

function getActiveSprintRow(userId: string, excludeSprintId?: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT *
       FROM sprints
       WHERE user_id = ?
         AND status = 'active'
         AND (? IS NULL OR id != ?)
       LIMIT 1`
    )
    .get(userId, excludeSprintId ?? null, excludeSprintId ?? null) as Sprint | undefined;
}

function assertSprintDates(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    throw new Error("開始日と終了日を入力してください。");
  }

  if (startDate > endDate) {
    throw new Error("開始日は終了日以前にしてください。");
  }
}

function assertStatusTransition(currentStatus: SprintStatus, nextStatus: SprintStatus) {
  const allowedTransitions: Record<SprintStatus, SprintStatus[]> = {
    planning: ["active", "completed"],
    active: ["review", "completed"],
    review: ["active", "completed"],
    completed: [],
  };

  if (currentStatus === nextStatus) {
    return;
  }

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new Error("スプリントの状態をその順序では変更できません。");
  }
}

function assertActiveSprintAvailable(userId: string, excludeSprintId?: string) {
  const activeSprint = getActiveSprintRow(userId, excludeSprintId);

  if (activeSprint) {
    throw new Error(
      "すでに active の sprint があります。先に review か completed へ進めてください。"
    );
  }
}

function getTaskRows(userId: string, taskIds: string[]) {
  const db = getDb();

  if (taskIds.length === 0) {
    return [] as Task[];
  }

  return db
    .prepare(
      `SELECT *
       FROM tasks
       WHERE user_id = ? AND id IN (${makePlaceholders(taskIds.length)})`
    )
    .all(userId, ...taskIds) as Task[];
}

function getSprintBoardRows(userId: string, sprintId: string, includeAssigned: boolean) {
  const db = getDb();
  const today = getTodayDate();
  const assignedJoin = includeAssigned
    ? "INNER JOIN sprint_tasks st ON st.task_id = t.id AND st.sprint_id = ?"
    : "LEFT JOIN sprint_tasks st ON st.task_id = t.id AND st.sprint_id = ?";
  const assignedWhere = includeAssigned
    ? "WHERE t.user_id = ? AND t.level = 'task'"
    : "WHERE t.user_id = ? AND t.level = 'task' AND st.task_id IS NULL AND t.status != 'done'";

  return db
    .prepare(
      `SELECT
         t.id,
         t.title,
         t.level,
         t.status,
         t.project_id,
         p.name AS project_name,
         t.parent_id,
         parent.title AS parent_title,
         parent.level AS parent_level,
         ancestor.title AS ancestor_title,
         ancestor.level AS ancestor_level,
         t.priority,
         COUNT(DISTINCT tnl.note_id) AS note_count,
         CASE WHEN df.id IS NULL THEN 0 ELSE 1 END AS is_in_daily_focus
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
       ${assignedJoin}
       LEFT JOIN tasks parent ON parent.id = t.parent_id AND parent.user_id = t.user_id
       LEFT JOIN tasks ancestor ON ancestor.id = parent.parent_id AND ancestor.user_id = t.user_id
       LEFT JOIN task_note_links tnl ON tnl.task_id = t.id
       LEFT JOIN daily_focus df ON df.task_id = t.id AND df.date = ? AND df.user_id = t.user_id
       ${assignedWhere}
       GROUP BY t.id
       ORDER BY
         CASE t.status
           WHEN 'blocked' THEN 0
           WHEN 'in_progress' THEN 1
           WHEN 'todo' THEN 2
           ELSE 3
         END,
         t.priority DESC,
         t.sort_order ASC,
         t.created_at ASC`
    )
    .all(sprintId, today, userId) as SprintBoardRow[];
}

function mapSprintBoardCards(rows: SprintBoardRow[]): SprintBoardCard[] {
  return rows.map((row) => ({
    ...row,
    is_in_daily_focus: Boolean(row.is_in_daily_focus),
  }));
}

function enumerateDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function pickReviewTarget(userId: string, sprintId?: string) {
  if (sprintId) {
    return getSprintSummaryById(userId, sprintId) ?? null;
  }

  const db = getDb();
  const active = db
    .prepare(`${getSprintSummarySelect("WHERE s.user_id = ? AND s.status = 'active'")} LIMIT 1`)
    .get(userId) as SprintSummary | undefined;

  if (active) {
    return active;
  }

  const completed = db
    .prepare(
      `${getSprintSummarySelect("WHERE s.user_id = ? AND s.status = 'completed'")}
       ORDER BY s.end_date DESC, s.created_at DESC
       LIMIT 1`
    )
    .get(userId) as SprintSummary | undefined;

  if (completed) {
    return completed;
  }

  return db
    .prepare(
      `${getSprintSummarySelect("WHERE s.user_id = ?")}
       ORDER BY
         CASE s.status
           WHEN 'review' THEN 0
           WHEN 'planning' THEN 1
           ELSE 2
         END,
         s.start_date DESC,
         s.created_at DESC
       LIMIT 1`
    )
    .get(userId) as SprintSummary | undefined;
}

export async function createSprint(data: {
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
  status?: SprintStatus;
}): Promise<Sprint> {
  const user = await requireUser();
  const db = getDb();
  const name = data.name.trim();
  const status = data.status ?? "planning";

  if (!name) {
    throw new Error("スプリント名を入力してください。");
  }

  assertSprintDates(data.startDate, data.endDate);

  if (status === "active") {
    assertActiveSprintAvailable(user.id);
  }

  db.prepare(
    `INSERT INTO sprints (user_id, name, start_date, end_date, goal, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(user.id, name, data.startDate, data.endDate, trimOrNull(data.goal), status);

  const sprint = db
    .prepare("SELECT * FROM sprints WHERE rowid = last_insert_rowid()")
    .get() as Sprint | undefined;

  if (!sprint) {
    throw new Error("スプリントの作成に失敗しました。");
  }

  revalidateSprintPaths();
  return sprint;
}

export async function listSprints(): Promise<SprintSummary[]> {
  const user = await requireUser();
  const db = getDb();

  return db
    .prepare(
      `${getSprintSummarySelect("WHERE s.user_id = ?")}
       ORDER BY
         CASE s.status
           WHEN 'active' THEN 0
           WHEN 'review' THEN 1
           WHEN 'planning' THEN 2
           ELSE 3
         END,
         s.start_date DESC,
         s.created_at DESC`
    )
    .all(user.id) as SprintSummary[];
}

export async function getActiveSprint(): Promise<SprintSummary | null> {
  const user = await requireUser();
  const db = getDb();
  const sprint = db
    .prepare(`${getSprintSummarySelect("WHERE s.user_id = ? AND s.status = 'active'")} LIMIT 1`)
    .get(user.id) as SprintSummary | undefined;

  return sprint ?? null;
}

export async function getSprintById(sprintId: string): Promise<SprintSummary | null> {
  const user = await requireUser();
  return getSprintSummaryById(user.id, sprintId) ?? null;
}

export async function assignTasksToSprint(sprintId: string, taskIds: string[]): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const sprint = getSprintRowById(user.id, sprintId);

  if (!sprint) {
    throw new Error("スプリントが見つかりません。");
  }

  const uniqueTaskIds = Array.from(new Set(taskIds.filter(Boolean)));
  const tasks = getTaskRows(user.id, uniqueTaskIds);

  if (uniqueTaskIds.length === 0 || tasks.length !== uniqueTaskIds.length) {
    throw new Error("追加対象のタスクが見つかりません。");
  }

  if (tasks.some((task) => task.level !== "task")) {
    throw new Error("スプリントに追加できるのは task レベルの項目だけです。");
  }

  db.transaction(() => {
    const insert = db.prepare(
      `INSERT OR IGNORE INTO sprint_tasks (sprint_id, task_id)
       VALUES (?, ?)`
    );

    uniqueTaskIds.forEach((taskId) => insert.run(sprintId, taskId));
  })();

  revalidateSprintPaths(tasks.map((task) => task.project_id));
}

export async function removeTaskFromSprint(sprintId: string, taskId: string): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const task = db
    .prepare("SELECT project_id FROM tasks WHERE id = ? AND user_id = ?")
    .get(taskId, user.id) as { project_id: string } | undefined;

  db.prepare(
    `DELETE FROM sprint_tasks
     WHERE sprint_id = ?
       AND task_id = ?
       AND sprint_id IN (SELECT id FROM sprints WHERE id = ? AND user_id = ?)`
  ).run(sprintId, taskId, sprintId, user.id);

  revalidateSprintPaths(task ? [task.project_id] : []);
}

export async function updateSprintStatus(sprintId: string, status: SprintStatus): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const sprint = getSprintRowById(user.id, sprintId);

  if (!sprint) {
    throw new Error("スプリントが見つかりません。");
  }

  assertStatusTransition(sprint.status, status);

  if (status === "active") {
    assertActiveSprintAvailable(user.id, sprintId);
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE sprints
       SET status = ?
       WHERE id = ? AND user_id = ?`
    ).run(status, sprintId, user.id);

    if (sprint.status !== "completed" && status === "completed") {
      db.prepare(
        `INSERT INTO activity_log (user_id, type, ref_id, description)
         VALUES (?, 'sprint_completed', ?, ?)`
      ).run(user.id, sprintId, sprint.name);
    }
  })();

  revalidateSprintPaths();
}

export async function updateSprintRetro(sprintId: string, retroNote: string): Promise<void> {
  const user = await requireUser();
  const sprint = getSprintRowById(user.id, sprintId);

  if (!sprint) {
    throw new Error("スプリントが見つかりません。");
  }

  getDb()
    .prepare(
      `UPDATE sprints
       SET retro_note = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(trimOrNull(retroNote), sprintId, user.id);

  revalidateSprintPaths();
}

export async function getSprintBoard(sprintId: string): Promise<SprintBoardData> {
  const user = await requireUser();
  const sprint = getSprintSummaryById(user.id, sprintId);

  if (!sprint) {
    throw new Error("スプリントが見つかりません。");
  }

  const assigned = mapSprintBoardCards(getSprintBoardRows(user.id, sprintId, true));
  const unassignedTasks = mapSprintBoardCards(getSprintBoardRows(user.id, sprintId, false));

  return {
    sprint,
    todo: assigned.filter((task) => task.status === "todo"),
    in_progress: assigned.filter((task) => task.status === "in_progress" || task.status === "blocked"),
    done: assigned.filter((task) => task.status === "done"),
    unassigned_tasks: unassignedTasks,
  };
}

export async function getReviewSummary(sprintId?: string): Promise<ReviewSummary> {
  const user = await requireUser();
  const db = getDb();
  const sprint = pickReviewTarget(user.id, sprintId) ?? null;

  if (!sprint) {
    return {
      sprint: null,
      completed_task_count: 0,
      note_count: 0,
      inbox_processed_count: 0,
      focus_completed_count: 0,
      activity_by_day: [],
    };
  }

  const activityRows = db
    .prepare(
      `SELECT
         substr(created_at, 1, 10) AS date,
         COUNT(*) AS total,
         SUM(CASE WHEN type = 'task_done' THEN 1 ELSE 0 END) AS task_done_count,
         SUM(CASE WHEN type = 'note_created' THEN 1 ELSE 0 END) AS note_created_count,
         SUM(CASE WHEN type = 'inbox_processed' THEN 1 ELSE 0 END) AS inbox_processed_count,
         SUM(CASE WHEN type = 'focus_completed' THEN 1 ELSE 0 END) AS focus_completed_count,
         SUM(CASE WHEN type = 'sprint_completed' THEN 1 ELSE 0 END) AS sprint_completed_count
       FROM activity_log
       WHERE user_id = ?
         AND substr(created_at, 1, 10) BETWEEN ? AND ?
       GROUP BY substr(created_at, 1, 10)
       ORDER BY date ASC`
    )
    .all(user.id, sprint.start_date, sprint.end_date) as ActivityByDay[];

  const activityMap = new Map(activityRows.map((row) => [row.date, row]));
  const activityByDay = enumerateDates(sprint.start_date, sprint.end_date).map((date) => {
    const row = activityMap.get(date);

    return (
      row ?? {
        date,
        total: 0,
        task_done_count: 0,
        note_created_count: 0,
        inbox_processed_count: 0,
        focus_completed_count: 0,
        sprint_completed_count: 0,
      }
    );
  });

  const totals = activityByDay.reduce(
    (accumulator, row) => ({
      noteCount: accumulator.noteCount + row.note_created_count,
      inboxProcessedCount: accumulator.inboxProcessedCount + row.inbox_processed_count,
      focusCompletedCount: accumulator.focusCompletedCount + row.focus_completed_count,
    }),
    {
      noteCount: 0,
      inboxProcessedCount: 0,
      focusCompletedCount: 0,
    }
  );

  return {
    sprint,
    completed_task_count: sprint.done_tasks,
    note_count: totals.noteCount,
    inbox_processed_count: totals.inboxProcessedCount,
    focus_completed_count: totals.focusCompletedCount,
    activity_by_day: activityByDay,
  };
}

export async function createSprintFormAction(
  previousState: SprintFormState,
  formData: FormData
): Promise<SprintFormState> {
  void previousState;

  try {
    await createSprint({
      name: String(formData.get("name") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      goal: String(formData.get("goal") ?? ""),
      status: formData.get("startNow") ? "active" : "planning",
    });

    return {
      status: "success",
      message: formData.get("startNow")
        ? "スプリントを作成して開始しました。"
        : "スプリントを作成しました。",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "スプリントの作成に失敗しました。",
    };
  }
}

export async function assignTasksToSprintAction(formData: FormData) {
  const taskIds = formData
    .getAll("taskIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  await assignTasksToSprint(String(formData.get("sprintId") ?? ""), taskIds);
}

export async function removeTaskFromSprintAction(formData: FormData) {
  await removeTaskFromSprint(
    String(formData.get("sprintId") ?? ""),
    String(formData.get("taskId") ?? "")
  );
}

export async function updateSprintStatusAction(formData: FormData) {
  await updateSprintStatus(
    String(formData.get("sprintId") ?? ""),
    String(formData.get("status") ?? "") as SprintStatus
  );
}

export async function updateSprintRetroAction(formData: FormData) {
  await updateSprintRetro(
    String(formData.get("sprintId") ?? ""),
    String(formData.get("retroNote") ?? "")
  );
}
