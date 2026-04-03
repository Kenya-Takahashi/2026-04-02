"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { splitTags, trimOrNull } from "@/lib/utils";
import type {
  Note,
  NoteDetail,
  NoteSummary,
  TagSummary,
  TaskOption,
  WikiLinkResolution,
} from "@/types";

export type NoteFormState = {
  status: "idle" | "success" | "error";
  message: string;
  noteId?: string;
};

type NoteRow = Omit<Note, "tags">;

function makePlaceholders(length: number) {
  return new Array(length).fill("?").join(", ");
}

function revalidateNotePaths(noteId?: string, linkedTaskIds: string[] = []) {
  const db = getDb();
  revalidatePath("/");
  revalidatePath("/notes");

  if (noteId) {
    revalidatePath(`/notes/${noteId}`);
  }

  if (linkedTaskIds.length > 0) {
    const uniqueTaskIds = Array.from(new Set(linkedTaskIds));
    const projectRows = db
      .prepare(
        `SELECT DISTINCT project_id
         FROM tasks
         WHERE id IN (${makePlaceholders(uniqueTaskIds.length)})`
      )
      .all(...uniqueTaskIds) as Array<{ project_id: string }>;

    projectRows.forEach((row) => revalidatePath(`/projects/${row.project_id}`));
  }

  revalidatePath("/projects");
}

function normalizeTitle(title: string) {
  return title.trim();
}

function buildPreview(content: string) {
  const normalized = content
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "まだ本文がありません。";
  }

  return normalized.length <= 120 ? normalized : `${normalized.slice(0, 120)}...`;
}

function extractWikiTitles(content: string) {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  const titles = new Set<string>();

  for (const match of Array.from(matches)) {
    const title = match[1]?.trim();

    if (title) {
      titles.add(title);
    }
  }

  return Array.from(titles);
}

function getNoteRow(userId: string, noteId: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?")
    .get(noteId, userId) as NoteRow | undefined;
}

function getTagsByNoteId(noteId: string) {
  const db = getDb();
  const rows = db
    .prepare("SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag ASC")
    .all(noteId) as Array<{ tag: string }>;

  return rows.map((row) => row.tag);
}

function getLinkedTasksByNoteId(userId: string, noteId: string) {
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
       FROM task_note_links tnl
       INNER JOIN tasks t ON t.id = tnl.task_id AND t.user_id = ?
       INNER JOIN projects p ON p.id = t.project_id AND p.user_id = t.user_id
       LEFT JOIN tasks parent ON parent.id = t.parent_id AND parent.user_id = t.user_id
       LEFT JOIN tasks ancestor ON ancestor.id = parent.parent_id AND ancestor.user_id = t.user_id
       WHERE tnl.note_id = ?
       ORDER BY p.name ASC, t.sort_order ASC, t.created_at ASC`
    )
    .all(userId, noteId) as TaskOption[];
}

function getResolvedLinksByNoteId(userId: string, noteId: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT n.id, n.title
       FROM note_links nl
       INNER JOIN notes n ON n.id = nl.target_id AND n.user_id = ?
       WHERE nl.source_id = ?
       ORDER BY n.title ASC`
    )
    .all(userId, noteId) as WikiLinkResolution[];
}

function getSummaryByNoteRow(note: NoteRow): NoteSummary {
  const db = getDb();
  const linkedTaskCount = db
    .prepare("SELECT COUNT(*) AS total FROM task_note_links WHERE note_id = ?")
    .get(note.id) as { total: number };

  return {
    ...note,
    tags: getTagsByNoteId(note.id),
    preview: buildPreview(note.content),
    linked_task_count: linkedTaskCount.total,
  };
}

function findExistingNoteByTitle(userId: string, title: string, excludeNoteId?: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id
       FROM notes
       WHERE user_id = ?
         AND title = ? COLLATE NOCASE
         AND (? IS NULL OR id != ?)
       LIMIT 1`
    )
    .get(userId, title, excludeNoteId ?? null, excludeNoteId ?? null) as { id: string } | undefined;
}

function assertUniqueTitle(userId: string, title: string, excludeNoteId?: string) {
  if (!title) {
    throw new Error("メモタイトルを入力してください。");
  }

  const duplicate = findExistingNoteByTitle(userId, title, excludeNoteId);

  if (duplicate) {
    throw new Error("同じタイトルのメモがすでにあります。別のタイトルにしてください。");
  }
}

function syncNoteTags(noteId: string, tags: string[]) {
  const db = getDb();
  const normalizedTags = splitTags(tags.join(","));

  db.prepare("DELETE FROM note_tags WHERE note_id = ?").run(noteId);

  const insertTag = db.prepare(
    `INSERT INTO note_tags (note_id, tag)
     VALUES (?, ?)`
  );

  normalizedTags.forEach((tag) => insertTag.run(noteId, tag));
}

function syncNoteLinks(userId: string, noteId: string, content: string) {
  const db = getDb();
  const wikiTitles = extractWikiTitles(content);
  const resolvedLinks: WikiLinkResolution[] = [];
  const unresolvedTitles: string[] = [];

  db.prepare("DELETE FROM note_links WHERE source_id = ?").run(noteId);

  if (wikiTitles.length === 0) {
    return { resolvedLinks, unresolvedTitles };
  }

  const insertLink = db.prepare(
    `INSERT OR IGNORE INTO note_links (source_id, target_id)
     VALUES (?, ?)`
  );

  wikiTitles.forEach((title) => {
    const target = db
      .prepare(
        `SELECT id, title
         FROM notes
         WHERE user_id = ?
           AND title = ? COLLATE NOCASE
           AND id != ?`
      )
      .get(userId, title, noteId) as WikiLinkResolution | undefined;

    if (target) {
      insertLink.run(noteId, target.id);
      resolvedLinks.push(target);
    } else {
      unresolvedTitles.push(title);
    }
  });

  return { resolvedLinks, unresolvedTitles };
}

function resolveWikiLinks(userId: string, noteId: string, content: string) {
  const db = getDb();
  const wikiTitles = extractWikiTitles(content);
  const resolvedLinks: WikiLinkResolution[] = [];
  const unresolvedTitles: string[] = [];

  wikiTitles.forEach((title) => {
    const target = db
      .prepare(
        `SELECT id, title
         FROM notes
         WHERE user_id = ?
           AND title = ? COLLATE NOCASE
           AND id != ?`
      )
      .get(userId, title, noteId) as WikiLinkResolution | undefined;

    if (target) {
      resolvedLinks.push(target);
    } else {
      unresolvedTitles.push(title);
    }
  });

  return { resolvedLinks, unresolvedTitles };
}

export async function setTaskNoteLinks(noteId: string, taskIds: string[]): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const note = getNoteRow(user.id, noteId);
  const uniqueTaskIds = Array.from(new Set(taskIds.filter(Boolean)));

  if (!note) {
    throw new Error("メモが見つかりません。");
  }

  if (uniqueTaskIds.length > 0) {
    const taskRows = db
      .prepare(
        `SELECT id
         FROM tasks
         WHERE user_id = ? AND id IN (${uniqueTaskIds.map(() => "?").join(", ")})`
      )
      .all(user.id, ...uniqueTaskIds) as Array<{ id: string }>;

    if (taskRows.length !== uniqueTaskIds.length) {
      throw new Error("紐付けできないタスクが含まれています。");
    }
  }

  db.transaction(() => {
    db.prepare("DELETE FROM task_note_links WHERE note_id = ?").run(noteId);

    const insertLink = db.prepare(
      `INSERT OR IGNORE INTO task_note_links (task_id, note_id)
       VALUES (?, ?)`
    );

    uniqueTaskIds.forEach((taskId) => insertLink.run(taskId, noteId));
  })();
}

export async function createNote(data: {
  title: string;
  content: string;
  tags: string[];
  linkedNoteIds?: string[];
}): Promise<NoteDetail> {
  const user = await requireUser();
  const db = getDb();
  const title = normalizeTitle(data.title);

  assertUniqueTitle(user.id, title);

  const created = db.transaction(() => {
    db.prepare(
      `INSERT INTO notes (user_id, title, content)
       VALUES (?, ?, ?)`
    ).run(user.id, title, data.content);

    const note = db
      .prepare("SELECT * FROM notes WHERE rowid = last_insert_rowid()")
      .get() as NoteRow | undefined;

    if (!note) {
      throw new Error("メモの作成に失敗しました。");
    }

    syncNoteTags(note.id, data.tags);
    syncNoteLinks(user.id, note.id, data.content);

    if (data.linkedNoteIds?.length) {
      const insertLink = db.prepare(
        `INSERT OR IGNORE INTO note_links (source_id, target_id)
         VALUES (?, ?)`
      );

      data.linkedNoteIds.forEach((linkedNoteId) => {
        const target = getNoteRow(user.id, linkedNoteId);

        if (target && linkedNoteId !== note.id) {
          insertLink.run(note.id, linkedNoteId);
        }
      });
    }

    db.prepare(
      `INSERT INTO activity_log (user_id, type, ref_id, description)
       VALUES (?, 'note_created', ?, ?)`
    ).run(user.id, note.id, title);

    return note.id;
  })();

  revalidateNotePaths(created);

  const detail = await getNoteById(created);

  if (!detail) {
    throw new Error("作成したメモの読み込みに失敗しました。");
  }

  return detail;
}

export async function getNoteById(noteId: string): Promise<NoteDetail | null> {
  const user = await requireUser();
  const row = getNoteRow(user.id, noteId);

  if (!row) {
    return null;
  }

  const summary = getSummaryByNoteRow(row);
  const { resolvedLinks, unresolvedTitles } = resolveWikiLinks(user.id, row.id, row.content);

  return {
    ...summary,
    linked_tasks: getLinkedTasksByNoteId(user.id, row.id),
    resolved_links: resolvedLinks.length > 0 ? resolvedLinks : getResolvedLinksByNoteId(user.id, row.id),
    unresolved_titles: unresolvedTitles,
  };
}

export async function updateNote(data: {
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  linkedTaskIds: string[];
}): Promise<NoteDetail> {
  const user = await requireUser();
  const db = getDb();
  const title = normalizeTitle(data.title);
  const existing = getNoteRow(user.id, data.noteId);
  const previousTaskIds = getLinkedTasksByNoteId(user.id, data.noteId).map((task) => task.id);

  if (!existing) {
    throw new Error("メモが見つかりません。");
  }

  assertUniqueTitle(user.id, title, data.noteId);

  db.transaction(() => {
    db.prepare(
      `UPDATE notes
       SET title = ?, content = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(title, data.content, data.noteId, user.id);

    syncNoteTags(data.noteId, data.tags);
    syncNoteLinks(user.id, data.noteId, data.content);
  })();

  await setTaskNoteLinks(data.noteId, data.linkedTaskIds);

  revalidateNotePaths(data.noteId, [...previousTaskIds, ...data.linkedTaskIds]);

  const detail = await getNoteById(data.noteId);

  if (!detail) {
    throw new Error("更新したメモの読み込みに失敗しました。");
  }

  return detail;
}

export async function searchNotes(query: {
  text?: string;
  tags?: string[];
  taskId?: string;
}): Promise<NoteSummary[]> {
  const user = await requireUser();
  const db = getDb();
  const text = trimOrNull(query.text);
  const tags = splitTags((query.tags ?? []).join(","));
  const taskId = trimOrNull(query.taskId);

  if (taskId) {
    const task = db
      .prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?")
      .get(taskId, user.id) as { id: string } | undefined;

    if (!task) {
      return [];
    }
  }

  const rows = db
    .prepare(
      `SELECT DISTINCT n.*
       FROM notes n
       ${taskId ? "INNER JOIN task_note_links tnl ON tnl.note_id = n.id" : ""}
       WHERE n.user_id = ?
         AND (? IS NULL OR n.title LIKE '%' || ? || '%' OR n.content LIKE '%' || ? || '%')
         ${taskId ? "AND tnl.task_id = ?" : ""}
       ORDER BY n.updated_at DESC`
    )
    .all(user.id, text ?? null, text ?? null, text ?? null, ...(taskId ? [taskId] : [])) as NoteRow[];

  const summaries = rows.map(getSummaryByNoteRow);

  if (tags.length === 0) {
    return summaries;
  }

  return summaries.filter((note) => tags.every((tag) => note.tags.includes(tag)));
}

export async function getRecentNotes(limit = 3): Promise<NoteSummary[]> {
  const user = await requireUser();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT *
       FROM notes
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT ?`
    )
    .all(user.id, limit) as NoteRow[];

  return rows.map(getSummaryByNoteRow);
}

export async function listTags(): Promise<TagSummary[]> {
  const user = await requireUser();
  const db = getDb();

  return db
    .prepare(
      `SELECT nt.tag, COUNT(*) AS count
       FROM note_tags nt
       INNER JOIN notes n ON n.id = nt.note_id
       WHERE n.user_id = ?
       GROUP BY nt.tag
       ORDER BY count DESC, nt.tag ASC`
    )
    .all(user.id) as TagSummary[];
}

export async function linkNotes(sourceId: string, targetId: string): Promise<void> {
  const user = await requireUser();
  const source = getNoteRow(user.id, sourceId);
  const target = getNoteRow(user.id, targetId);

  if (!source || !target || sourceId === targetId) {
    return;
  }

  getDb()
    .prepare(
      `INSERT OR IGNORE INTO note_links (source_id, target_id)
       VALUES (?, ?)`
    )
    .run(sourceId, targetId);

  revalidateNotePaths(sourceId);
}

export async function createNoteFromListAction(
  previousState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  void previousState;

  try {
    const created = await createNote({
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      tags: splitTags(String(formData.get("tags") ?? "")),
    });

    return {
      status: "success",
      message: "メモを作成しました。",
      noteId: created.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "メモの作成に失敗しました。",
    };
  }
}

export async function updateNoteFormAction(
  previousState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  void previousState;

  try {
    const noteId = String(formData.get("noteId") ?? "");
    const linkedTaskIds = formData
      .getAll("linkedTaskIds")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);

    const updated = await updateNote({
      noteId,
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      tags: splitTags(String(formData.get("tags") ?? "")),
      linkedTaskIds,
    });

    return {
      status: "success",
      message: "メモを保存しました。",
      noteId: updated.id,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "メモの保存に失敗しました。",
    };
  }
}
