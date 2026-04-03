import type Database from "better-sqlite3";

const SCHEMA_VERSION = "6";

const META_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
];

const TABLES_TO_RESET = [
  "sessions",
  "oauth_accounts",
  "activity_log",
  "daily_focus",
  "sprint_tasks",
  "sprints",
  "inbox",
  "task_note_links",
  "note_links",
  "note_tags",
  "notes",
  "tasks",
  "projects",
  "users",
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT,
    image       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS oauth_accounts (
    user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider             TEXT NOT NULL,
    provider_account_id  TEXT NOT NULL,
    email                TEXT NOT NULL,
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (provider, provider_account_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash  TEXT NOT NULL UNIQUE,
    expires_at          TEXT NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);`,
  `CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'archived')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id   TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    level       TEXT NOT NULL CHECK (level IN ('epic', 'story', 'task')),
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
    priority    INTEGER NOT NULL DEFAULT 0,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
  `CREATE TABLE IF NOT EXISTS notes (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);`,
  `CREATE TABLE IF NOT EXISTS note_tags (
    note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag      TEXT NOT NULL,
    PRIMARY KEY (note_id, tag)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);`,
  `CREATE TABLE IF NOT EXISTS note_links (
    source_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    PRIMARY KEY (source_id, target_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_id);`,
  `CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_id);`,
  `CREATE TABLE IF NOT EXISTS task_note_links (
    task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, note_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_task_note_links_task ON task_note_links(task_id);`,
  `CREATE INDEX IF NOT EXISTS idx_task_note_links_note ON task_note_links(note_id);`,
  `CREATE TABLE IF NOT EXISTS inbox (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    source        TEXT,
    processed     INTEGER NOT NULL DEFAULT 0,
    processed_to  TEXT,
    processed_ref TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_inbox_user_processed ON inbox(user_id, processed);`,
  `CREATE TABLE IF NOT EXISTS sprints (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    goal        TEXT,
    status      TEXT NOT NULL DEFAULT 'planning'
                  CHECK (status IN ('planning', 'active', 'review', 'completed')),
    retro_note  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_sprints_user_status ON sprints(user_id, status);`,
  `CREATE TABLE IF NOT EXISTS sprint_tasks (
    sprint_id  TEXT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (sprint_id, task_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint ON sprint_tasks(sprint_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sprint_tasks_task ON sprint_tasks(task_id);`,
  `CREATE TABLE IF NOT EXISTS daily_focus (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    completed   INTEGER NOT NULL DEFAULT 0,
    reflection  TEXT,
    UNIQUE(user_id, date, task_id)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_daily_focus_user_date ON daily_focus(user_id, date);`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL
                  CHECK (type IN ('task_done', 'note_created', 'inbox_processed', 'focus_completed', 'sprint_completed')),
    ref_id      TEXT,
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  `CREATE INDEX IF NOT EXISTS idx_activity_log_user_type ON activity_log(user_id, type);`,
  `CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, created_at);`,
];

function getStoredVersion(db: Database.Database) {
  const row = db
    .prepare(
      `SELECT value
       FROM app_meta
       WHERE key = 'schema_version'
       LIMIT 1`
    )
    .get() as { value: string } | undefined;

  return row?.value ?? null;
}

function dropKnownTables(db: Database.Database) {
  TABLES_TO_RESET.forEach((table) => {
    db.exec(`DROP TABLE IF EXISTS ${table};`);
  });
}

export function initializeSchema(db: Database.Database) {
  const initialize = db.transaction(() => {
    META_STATEMENTS.forEach((statement) => db.exec(statement));

    const storedVersion = getStoredVersion(db);

    if (storedVersion !== SCHEMA_VERSION) {
      dropKnownTables(db);
      META_STATEMENTS.forEach((statement) => db.exec(statement));
    }

    SCHEMA_STATEMENTS.forEach((statement) => db.exec(statement));

    db.prepare(
      `INSERT INTO app_meta (key, value)
       VALUES ('schema_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(SCHEMA_VERSION);
  });

  initialize();
}
