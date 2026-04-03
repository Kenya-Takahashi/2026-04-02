"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getTodayDate } from "@/lib/date";
import { getDb } from "@/lib/db";
import { trimOrNull } from "@/lib/utils";
import type {
  Project,
  ProjectSummary,
  Task,
  TaskLevel,
  TaskOption,
  TaskStatus,
  TaskTreeNode,
} from "@/types";

function mapTaskTree(
  rows: Array<Task & { project_name: string; is_in_daily_focus: number; note_count: number }>
): TaskTreeNode[] {
  const nodes = new Map<string, TaskTreeNode>();

  for (const row of rows) {
    nodes.set(row.id, {
      ...row,
      is_in_daily_focus: Boolean(row.is_in_daily_focus),
      note_count: row.note_count,
      children: [],
    });
  }

  const roots: TaskTreeNode[] = [];

  for (const node of Array.from(nodes.values())) {
    if (node.parent_id && nodes.has(node.parent_id)) {
      nodes.get(node.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: TaskTreeNode[]) => {
    items.sort(
      (left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at)
    );
    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);
  return roots;
}

function assertValidLevelParent(level: TaskLevel, parent: Task | null) {
  if (level === "epic" && parent) {
    throw new Error("Epic はルート階層にのみ追加できます。");
  }

  if (level === "story" && (!parent || parent.level !== "epic")) {
    throw new Error("Story は Epic の配下にのみ追加できます。");
  }

  if (level === "task" && (!parent || parent.level !== "story")) {
    throw new Error("Task は Story の配下にのみ追加できます。");
  }
}

function getProjectById(userId: string, projectId: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(projectId, userId) as Project | undefined;
}

function getTaskById(userId: string, taskId: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(taskId, userId) as Task | undefined;
}

function getNextSortOrder(userId: string, projectId: string, parentId: string | null) {
  const db = getDb();

  if (parentId) {
    const row = db
      .prepare(
        `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
         FROM tasks
         WHERE user_id = ? AND project_id = ? AND parent_id = ?`
      )
      .get(userId, projectId, parentId) as { next_sort_order: number };

    return row.next_sort_order;
  }

  const row = db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
       FROM tasks
       WHERE user_id = ? AND project_id = ? AND parent_id IS NULL`
    )
    .get(userId, projectId) as { next_sort_order: number };

  return row.next_sort_order;
}

function revalidateTaskPaths(projectId?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/sprint");
  revalidatePath("/review");

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  const user = await requireUser();
  const db = getDb();
  const name = data.name.trim();

  if (!name) {
    throw new Error("プロジェクト名を入力してください。");
  }

  db.prepare(
    `INSERT INTO projects (user_id, name, description)
     VALUES (?, ?, ?)`
  ).run(user.id, name, trimOrNull(data.description));

  const project = db
    .prepare("SELECT * FROM projects WHERE rowid = last_insert_rowid()")
    .get() as Project | undefined;

  if (!project) {
    throw new Error("プロジェクトの作成に失敗しました。");
  }

  revalidateTaskPaths(project.id);
  return project;
}

export async function createProjectAction(formData: FormData) {
  await createProject({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const user = await requireUser();
  const db = getDb();

  return db
    .prepare(
      `SELECT
         p.*,
         COUNT(t.id) AS taskCount,
         SUM(CASE WHEN t.id IS NOT NULL AND t.status != 'done' THEN 1 ELSE 0 END) AS openTaskCount
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY
         CASE p.status
           WHEN 'active' THEN 0
           WHEN 'completed' THEN 1
           ELSE 2
         END,
         p.updated_at DESC`
    )
    .all(user.id) as ProjectSummary[];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const user = await requireUser();
  return getProjectById(user.id, projectId) ?? null;
}

export async function createTask(data: {
  projectId: string;
  parentId?: string;
  level: TaskLevel;
  title: string;
  description?: string;
}): Promise<Task> {
  const user = await requireUser();
  const db = getDb();
  const title = data.title.trim();

  if (!title) {
    throw new Error("タスク名を入力してください。");
  }

  const project = getProjectById(user.id, data.projectId);
  if (!project) {
    throw new Error("プロジェクトが見つかりません。");
  }

  const parent = data.parentId ? getTaskById(user.id, data.parentId) ?? null : null;

  if (parent && parent.project_id !== data.projectId) {
    throw new Error("親タスクは同じプロジェクトから選んでください。");
  }

  assertValidLevelParent(data.level, parent);

  const sortOrder = getNextSortOrder(user.id, data.projectId, data.parentId ?? null);

  db.prepare(
    `INSERT INTO tasks (user_id, project_id, parent_id, level, title, description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    user.id,
    data.projectId,
    data.parentId ?? null,
    data.level,
    title,
    trimOrNull(data.description),
    sortOrder
  );

  const task = db
    .prepare("SELECT * FROM tasks WHERE rowid = last_insert_rowid()")
    .get() as Task | undefined;

  if (!task) {
    throw new Error("タスクの作成に失敗しました。");
  }

  revalidateTaskPaths(task.project_id);
  return task;
}

export async function createTaskAction(formData: FormData) {
  await createTask({
    projectId: String(formData.get("projectId") ?? ""),
    parentId: trimOrNull(formData.get("parentId")) ?? undefined,
    level: String(formData.get("level") ?? "") as TaskLevel,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
}

export async function updateTask(data: {
  taskId: string;
  title: string;
  description?: string;
  priority?: number;
}): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const task = getTaskById(user.id, data.taskId);
  const title = data.title.trim();

  if (!task) {
    throw new Error("タスクが見つかりません。");
  }

  if (!title) {
    throw new Error("タスク名を入力してください。");
  }

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, priority = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(title, trimOrNull(data.description), data.priority ?? task.priority, data.taskId, user.id);

  revalidateTaskPaths(task.project_id);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const task = getTaskById(user.id, taskId);

  if (!task) {
    throw new Error("タスクが見つかりません。");
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE tasks
       SET status = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(status, taskId, user.id);

    if (task.status !== "done" && status === "done") {
      db.prepare(
        `INSERT INTO activity_log (user_id, type, ref_id, description)
         VALUES (?, 'task_done', ?, ?)`
      ).run(user.id, task.id, task.title);
    }
  })();

  revalidateTaskPaths(task.project_id);
}

export async function updateTaskStatusAction(formData: FormData) {
  await updateTaskStatus(
    String(formData.get("taskId") ?? ""),
    String(formData.get("status") ?? "") as TaskStatus
  );
}

export async function getTaskTree(projectId: string): Promise<TaskTreeNode[]> {
  const user = await requireUser();
  const db = getDb();
  const today = getTodayDate();

  const rows = db
    .prepare(
      `SELECT
         t.*,
         p.name AS project_name,
         CASE WHEN df.id IS NULL THEN 0 ELSE 1 END AS is_in_daily_focus,
         COUNT(DISTINCT tnl.note_id) AS note_count
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
       LEFT JOIN daily_focus df ON df.task_id = t.id AND df.date = ? AND df.user_id = t.user_id
       LEFT JOIN task_note_links tnl ON tnl.task_id = t.id
       WHERE t.project_id = ? AND t.user_id = ?
       GROUP BY t.id
       ORDER BY t.sort_order ASC, t.created_at ASC`
    )
    .all(today, projectId, user.id) as Array<
    Task & { project_name: string; is_in_daily_focus: number; note_count: number }
  >;

  return mapTaskTree(rows);
}

export async function listTaskOptions(projectId?: string): Promise<TaskOption[]> {
  const user = await requireUser();
  const db = getDb();

  const baseQuery = `SELECT
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
      ancestor.level AS ancestor_level
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
    LEFT JOIN tasks parent ON parent.id = t.parent_id AND parent.user_id = t.user_id
    LEFT JOIN tasks ancestor ON ancestor.id = parent.parent_id AND ancestor.user_id = t.user_id
    WHERE t.user_id = ?
      ${projectId ? "AND t.project_id = ?" : ""}
    ORDER BY p.name ASC, t.level ASC, t.sort_order ASC, t.created_at ASC`;

  return projectId
    ? (db.prepare(baseQuery).all(user.id, projectId) as TaskOption[])
    : (db.prepare(baseQuery).all(user.id) as TaskOption[]);
}

export async function listOpenTaskOptions(): Promise<TaskOption[]> {
  const user = await requireUser();
  const db = getDb();

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
         ancestor.level AS ancestor_level
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
       LEFT JOIN tasks parent ON parent.id = t.parent_id AND parent.user_id = t.user_id
       LEFT JOIN tasks ancestor ON ancestor.id = parent.parent_id AND ancestor.user_id = t.user_id
       WHERE t.user_id = ? AND t.status != 'done'
       ORDER BY p.updated_at DESC, t.priority DESC, t.sort_order ASC, t.created_at ASC`
    )
    .all(user.id) as TaskOption[];
}

export async function reorderTask(
  taskId: string,
  newParentId: string | null,
  newSortOrder: number
): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const task = getTaskById(user.id, taskId);

  if (!task) {
    throw new Error("並び替え対象のタスクが見つかりません。");
  }

  const nextParent = newParentId ? getTaskById(user.id, newParentId) ?? null : null;

  if (nextParent && nextParent.project_id !== task.project_id) {
    throw new Error("親タスクは同じプロジェクトから選んでください。");
  }

  assertValidLevelParent(task.level, nextParent);

  const targetSiblings = (newParentId
    ? db
        .prepare(
          `SELECT id
           FROM tasks
           WHERE user_id = ? AND project_id = ? AND parent_id = ? AND id != ?
           ORDER BY sort_order ASC, created_at ASC`
        )
        .all(user.id, task.project_id, newParentId, task.id)
    : db
        .prepare(
          `SELECT id
           FROM tasks
           WHERE user_id = ? AND project_id = ? AND parent_id IS NULL AND id != ?
           ORDER BY sort_order ASC, created_at ASC`
        )
        .all(user.id, task.project_id, task.id)) as Array<{ id: string }>;

  const orderedIds = targetSiblings.map((sibling) => sibling.id);
  const clampedIndex = Math.max(0, Math.min(newSortOrder, orderedIds.length));
  orderedIds.splice(clampedIndex, 0, task.id);

  const previousSiblingIds = (task.parent_id
    ? db
        .prepare(
          `SELECT id
           FROM tasks
           WHERE user_id = ? AND project_id = ? AND parent_id = ? AND id != ?
           ORDER BY sort_order ASC, created_at ASC`
        )
        .all(user.id, task.project_id, task.parent_id, task.id)
    : db
        .prepare(
          `SELECT id
           FROM tasks
           WHERE user_id = ? AND project_id = ? AND parent_id IS NULL AND id != ?
           ORDER BY sort_order ASC, created_at ASC`
        )
        .all(user.id, task.project_id, task.id)) as Array<{ id: string }>;

  db.transaction(() => {
    orderedIds.forEach((id, index) => {
      db.prepare(
        `UPDATE tasks
         SET parent_id = ?, sort_order = ?, updated_at = CASE WHEN id = ? THEN datetime('now') ELSE updated_at END
         WHERE id = ? AND user_id = ?`
      ).run(newParentId, index, task.id, id, user.id);
    });

    if (task.parent_id !== newParentId) {
      previousSiblingIds.forEach((item, index) => {
        db.prepare(
          `UPDATE tasks
           SET sort_order = ?
           WHERE id = ? AND user_id = ?`
        ).run(index, item.id, user.id);
      });
    }
  })();

  revalidateTaskPaths(task.project_id);
}

export async function moveTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const task = getTaskById(user.id, taskId);

  if (!task) {
    throw new Error("タスクが見つかりません。");
  }

  const db = getDb();
  const siblings = (task.parent_id
    ? db
        .prepare(
          `SELECT id
           FROM tasks
           WHERE user_id = ? AND project_id = ? AND parent_id = ?
           ORDER BY sort_order ASC, created_at ASC`
        )
        .all(user.id, task.project_id, task.parent_id)
    : db
        .prepare(
          `SELECT id
           FROM tasks
           WHERE user_id = ? AND project_id = ? AND parent_id IS NULL
           ORDER BY sort_order ASC, created_at ASC`
        )
        .all(user.id, task.project_id)) as Array<{ id: string }>;

  const index = siblings.findIndex((item) => item.id === taskId);

  if (index === -1) {
    return;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= siblings.length) {
    return;
  }

  await reorderTask(taskId, task.parent_id, targetIndex);
}
