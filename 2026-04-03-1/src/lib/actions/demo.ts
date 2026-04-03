"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { getTodayDate } from "@/lib/date";
import { getDb } from "@/lib/db";

export type DemoSeedFormState = {
  status: "idle" | "success" | "info" | "error";
  message: string;
  stamp: number;
};

const DEMO_PROJECTS = [
  {
    name: "デモ: 研究レビュー改善",
    description:
      "研究レビュー作業を分解し、メモとふりかえりをひとつの流れで扱うためのサンプルプロジェクトです。",
    status: "active" as const,
  },
  {
    name: "デモ: インタビュー設計メモ",
    description: "仮説検証のための質問設計とサマリー整理を試すためのサブプロジェクトです。",
    status: "active" as const,
  },
];

const DEMO_NOTE = {
  title: "研究レビューの観点メモ",
  content:
    "比較軸を先に決めてから読むと、関連研究の差分が見えやすい。\n\n次は [[週次レビューの下書き]] にまとめる。",
  tags: ["レビュー", "研究メモ"],
};

const DEMO_SECOND_NOTE = {
  title: "週次レビューの下書き",
  content:
    "今週は論文比較の軸を作れた。来週は [[研究レビューの観点メモ]] をもとに結論の下書きを進める。",
  tags: ["ふりかえり", "下書き"],
};

const DEMO_INBOX_ITEMS = [
  {
    content: "レビュー比較軸を 3 つに絞る",
    source: "論文を読みながら気づいた",
    processed: 0,
    processed_to: null,
    ref: null,
  },
  {
    content: "インタビュー質問を 1 ページにまとめる",
    source: "打ち合わせメモ",
    processed: 0,
    processed_to: null,
    ref: null,
  },
  {
    content: "参考メモを Notes に移し替える",
    source: "朝のレビュー時間",
    processed: 1,
    processed_to: "note",
    ref: "note",
  },
];

function revalidateDemoPaths() {
  revalidatePath("/");
  revalidatePath("/inbox");
  revalidatePath("/projects");
  revalidatePath("/notes");
  revalidatePath("/sprint");
  revalidatePath("/review");
}

function makePlaceholders(length: number) {
  return new Array(length).fill("?").join(", ");
}

function hasDemoProject(userId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT id FROM projects WHERE user_id = ? AND name = ?")
    .get(userId, DEMO_PROJECTS[0].name) as { id: string } | undefined;

  return Boolean(row);
}

export async function seedDemoDataAction(
  previousState: DemoSeedFormState
): Promise<DemoSeedFormState> {
  const user = await requireUser();
  const db = getDb();

  try {
    if (hasDemoProject(user.id)) {
      return {
        status: "info",
        message: "このユーザーにはすでにデモデータが入っています。",
        stamp: previousState.stamp + 1,
      };
    }

    const today = getTodayDate();

    db.transaction(() => {
      const insertProject = db.prepare(
        `INSERT INTO projects (user_id, name, description, status)
         VALUES (?, ?, ?, ?)`
      );
      const insertTask = db.prepare(
        `INSERT INTO tasks (user_id, project_id, parent_id, level, title, description, status, priority, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const insertInbox = db.prepare(
        `INSERT INTO inbox (user_id, content, source, processed, processed_to, processed_ref)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      const insertNote = db.prepare(
        `INSERT INTO notes (user_id, title, content)
         VALUES (?, ?, ?)`
      );
      const insertTag = db.prepare(
        `INSERT INTO note_tags (note_id, tag)
         VALUES (?, ?)`
      );
      const insertNoteLink = db.prepare(
        `INSERT INTO note_links (source_id, target_id)
         VALUES (?, ?)`
      );
      const insertTaskNoteLink = db.prepare(
        `INSERT INTO task_note_links (task_id, note_id)
         VALUES (?, ?)`
      );
      const insertFocus = db.prepare(
        `INSERT INTO daily_focus (user_id, date, task_id, sort_order, completed, reflection)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      const insertSprint = db.prepare(
        `INSERT INTO sprints (user_id, name, start_date, end_date, goal, status, retro_note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      const insertSprintTask = db.prepare(
        `INSERT INTO sprint_tasks (sprint_id, task_id)
         VALUES (?, ?)`
      );
      const insertActivity = db.prepare(
        `INSERT INTO activity_log (user_id, type, ref_id, description)
         VALUES (?, ?, ?, ?)`
      );

      insertProject.run(user.id, DEMO_PROJECTS[0].name, DEMO_PROJECTS[0].description, DEMO_PROJECTS[0].status);
      const mainProject = db.prepare("SELECT id FROM projects WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertProject.run(user.id, DEMO_PROJECTS[1].name, DEMO_PROJECTS[1].description, DEMO_PROJECTS[1].status);
      const sideProject = db.prepare("SELECT id FROM projects WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        mainProject.id,
        null,
        "epic",
        "レビューの進め方を整える",
        "研究レビューを、比較軸・メモ・結論下書きまで一連の流れで扱えるようにする。",
        "in_progress",
        3,
        0
      );
      const epicReview = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        mainProject.id,
        epicReview.id,
        "story",
        "比較軸を作る",
        "比較観点を先に言語化して、レビューの観点を揃える。",
        "in_progress",
        2,
        0
      );
      const storyAxes = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        mainProject.id,
        storyAxes.id,
        "task",
        "比較軸を 3 つに整理する",
        "適用領域、評価方法、限界の 3 軸で見る。",
        "todo",
        2,
        0
      );
      const taskAxes = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        mainProject.id,
        storyAxes.id,
        "task",
        "関連論文を 5 本読み直す",
        "比較軸に沿って差分を書き出す。",
        "in_progress",
        3,
        1
      );
      const taskPapers = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        mainProject.id,
        epicReview.id,
        "story",
        "結論の下書きを作る",
        "メモをつなぎ、共有用の文にまとめる。",
        "todo",
        1,
        1
      );
      const storyDraft = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        mainProject.id,
        storyDraft.id,
        "task",
        "週次レビューの下書きを書く",
        "いま見えている差分だけ先に文章化する。",
        "blocked",
        1,
        0
      );
      const taskDraft = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        sideProject.id,
        null,
        "epic",
        "インタビュー質問を整える",
        "打ち合わせ前に質問の流れを固める。",
        "todo",
        1,
        0
      );
      const sideEpic = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        sideProject.id,
        sideEpic.id,
        "story",
        "候補質問を洗い出す",
        "仮説ごとに質問例を並べる。",
        "todo",
        1,
        0
      );
      const sideStory = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertTask.run(
        user.id,
        sideProject.id,
        sideStory.id,
        "task",
        "インタビュー質問を 1 ページに整理する",
        "聞き順と観点がすぐ分かる状態にする。",
        "done",
        0,
        0
      );
      const sideTask = db.prepare("SELECT id FROM tasks WHERE rowid = last_insert_rowid()").get() as {
        id: string;
      };

      insertNote.run(user.id, DEMO_NOTE.title, DEMO_NOTE.content);
      const noteA = db.prepare("SELECT id FROM notes WHERE rowid = last_insert_rowid()").get() as { id: string };

      insertNote.run(user.id, DEMO_SECOND_NOTE.title, DEMO_SECOND_NOTE.content);
      const noteB = db.prepare("SELECT id FROM notes WHERE rowid = last_insert_rowid()").get() as { id: string };

      DEMO_NOTE.tags.forEach((tag) => insertTag.run(noteA.id, tag));
      DEMO_SECOND_NOTE.tags.forEach((tag) => insertTag.run(noteB.id, tag));
      insertNoteLink.run(noteA.id, noteB.id);
      insertNoteLink.run(noteB.id, noteA.id);
      insertTaskNoteLink.run(taskAxes.id, noteA.id);
      insertTaskNoteLink.run(taskDraft.id, noteB.id);

      insertFocus.run(user.id, today, taskPapers.id, 0, 0, null);
      insertFocus.run(user.id, today, taskAxes.id, 1, 0, null);
      insertFocus.run(user.id, today, taskDraft.id, 2, 1, "下書きの骨子だけ先に書くと進めやすかった。");

      DEMO_INBOX_ITEMS.forEach((item) => {
        const ref = item.ref === "note" ? noteA.id : null;
        insertInbox.run(user.id, item.content, item.source, item.processed, item.processed_to, ref);
      });

      insertSprint.run(
        user.id,
        "今週のレビュー整備",
        today,
        today,
        "比較軸を整え、レビューの下書きに着手する。",
        "active",
        null
      );
      const sprint = db.prepare("SELECT id FROM sprints WHERE rowid = last_insert_rowid()").get() as { id: string };

      [taskAxes.id, taskPapers.id, taskDraft.id].forEach((taskId) => insertSprintTask.run(sprint.id, taskId));

      insertActivity.run(user.id, "task_done", sideTask.id, "インタビュー質問を 1 ページに整理する");
      insertActivity.run(user.id, "note_created", noteA.id, DEMO_NOTE.title);
      insertActivity.run(user.id, "note_created", noteB.id, DEMO_SECOND_NOTE.title);
      insertActivity.run(user.id, "focus_completed", taskDraft.id, "週次レビューの下書きを書く");
      insertActivity.run(user.id, "inbox_processed", noteA.id, "参考メモを Notes に移し替える");
    })();

    revalidateDemoPaths();

    return {
      status: "success",
      message: "ログイン中ユーザー向けにデモデータを追加しました。",
      stamp: previousState.stamp + 1,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "デモデータの追加に失敗しました。",
      stamp: previousState.stamp + 1,
    };
  }
}

export async function clearDemoDataAction(
  previousState: DemoSeedFormState
): Promise<DemoSeedFormState> {
  const user = await requireUser();
  const db = getDb();

  try {
    const projectRows = db
      .prepare(
        `SELECT id
         FROM projects
         WHERE user_id = ?
           AND name IN (${makePlaceholders(DEMO_PROJECTS.length)})`
      )
      .all(user.id, ...DEMO_PROJECTS.map((project) => project.name)) as Array<{ id: string }>;

    if (projectRows.length === 0) {
      return {
        status: "info",
        message: "削除できるデモデータは見つかりませんでした。",
        stamp: previousState.stamp + 1,
      };
    }

    const projectIds = projectRows.map((row) => row.id);
    const noteRows = db
      .prepare(
        `SELECT id
         FROM notes
         WHERE user_id = ?
           AND title IN (?, ?)`
      )
      .all(user.id, DEMO_NOTE.title, DEMO_SECOND_NOTE.title) as Array<{ id: string }>;
    const noteIds = noteRows.map((row) => row.id);

    db.transaction(() => {
      db.prepare("DELETE FROM projects WHERE user_id = ? AND id IN (" + makePlaceholders(projectIds.length) + ")")
        .run(user.id, ...projectIds);

      if (noteIds.length > 0) {
        db.prepare(`DELETE FROM notes WHERE user_id = ? AND id IN (${makePlaceholders(noteIds.length)})`).run(
          user.id,
          ...noteIds
        );
      }

      db.prepare(
        `DELETE FROM inbox
         WHERE user_id = ?
           AND content IN (${makePlaceholders(DEMO_INBOX_ITEMS.length)})`
      ).run(user.id, ...DEMO_INBOX_ITEMS.map((item) => item.content));

      db.prepare(
        `DELETE FROM sprints
         WHERE user_id = ? AND name = ?`
      ).run(user.id, "今週のレビュー整備");

      db.prepare(
        `DELETE FROM activity_log
         WHERE user_id = ?
           AND (
             description IN (?, ?, ?, ?, ?)
             OR ref_id IN (${makePlaceholders(noteIds.length || 1)})
           )`
      ).run(
        user.id,
        "インタビュー質問を 1 ページに整理する",
        DEMO_NOTE.title,
        DEMO_SECOND_NOTE.title,
        "週次レビューの下書きを書く",
        "参考メモを Notes に移し替える",
        ...(noteIds.length > 0 ? noteIds : [""])
      );
    })();

    revalidateDemoPaths();

    return {
      status: "success",
      message: "ログイン中ユーザーのデモデータを削除しました。",
      stamp: previousState.stamp + 1,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "デモデータの削除に失敗しました。",
      stamp: previousState.stamp + 1,
    };
  }
}
