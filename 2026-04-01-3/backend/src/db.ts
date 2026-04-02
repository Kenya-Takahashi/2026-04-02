import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import type { NodeRow, PageBlock, NodeType } from "./types.js";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "studio-notes.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pages (
    node_id TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
    content_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const getTreeStmt = db.prepare(`
  SELECT id, parent_id, type, name, sort_order, created_at, updated_at
  FROM nodes
  ORDER BY parent_id IS NOT NULL, parent_id, sort_order, created_at
`);

const getChildrenStmt = db.prepare(`
  SELECT id, parent_id, type, name, sort_order, created_at, updated_at
  FROM nodes
  WHERE parent_id IS ?
  ORDER BY sort_order, created_at
`);

const getNodeStmt = db.prepare(`
  SELECT id, parent_id, type, name, sort_order, created_at, updated_at
  FROM nodes
  WHERE id = ?
`);

const insertNodeStmt = db.prepare(`
  INSERT INTO nodes (id, parent_id, type, name, sort_order, created_at, updated_at)
  VALUES (@id, @parent_id, @type, @name, @sort_order, @created_at, @updated_at)
`);

const insertPageStmt = db.prepare(`
  INSERT INTO pages (node_id, content_json, created_at, updated_at)
  VALUES (@node_id, @content_json, @created_at, @updated_at)
`);

const updateNodeNameStmt = db.prepare(`
  UPDATE nodes
  SET name = @name, updated_at = @updated_at
  WHERE id = @id
`);

const updateNodeParentStmt = db.prepare(`
  UPDATE nodes
  SET parent_id = @parent_id, updated_at = @updated_at
  WHERE id = @id
`);

const updateSortStmt = db.prepare(`
  UPDATE nodes
  SET sort_order = @sort_order, updated_at = @updated_at
  WHERE id = @id
`);

const deleteNodeStmt = db.prepare(`DELETE FROM nodes WHERE id = ?`);

const getPageStmt = db.prepare(`
  SELECT node_id, content_json, updated_at
  FROM pages
  WHERE node_id = ?
`);

const savePageStmt = db.prepare(`
  INSERT INTO pages (node_id, content_json, created_at, updated_at)
  VALUES (@node_id, @content_json, @created_at, @updated_at)
  ON CONFLICT(node_id) DO UPDATE SET
    content_json = excluded.content_json,
    updated_at = excluded.updated_at
`);

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

function makeDefaultName(siblings: NodeRow[]) {
  const datePart = new Date().toISOString().slice(0, 10);
  const names = new Set(siblings.map((row) => row.name));
  let index = 1;
  while (names.has(`${datePart}-${index}`)) {
    index += 1;
  }
  return `${datePart}-${index}`;
}

function normalizeBlocks(blocks?: PageBlock[]): PageBlock[] {
  if (!blocks || blocks.length === 0) {
    return [{ id: createId("text"), type: "text", text: "" }];
  }

  return blocks.map((block) => {
    if (block.type === "text") {
      return {
        id: block.id || createId("text"),
        type: "text",
        text: block.text ?? ""
      };
    }
    return {
      id: block.id || createId("code"),
      type: "code",
      language: block.language || "ts",
      code: block.code ?? ""
    };
  });
}

export function listNodes() {
  return getTreeStmt.all() as NodeRow[];
}

export function getNode(id: string) {
  return (getNodeStmt.get(id) as NodeRow | undefined) ?? null;
}

export function createNode(parentId: string | null, type: NodeType) {
  const siblings = getChildrenStmt.all(parentId) as NodeRow[];
  const timestamp = nowIso();
  const node: NodeRow = {
    id: createId(type),
    parent_id: parentId,
    type,
    name: makeDefaultName(siblings),
    sort_order: siblings.length,
    created_at: timestamp,
    updated_at: timestamp
  };

  const transaction = db.transaction(() => {
    insertNodeStmt.run(node);
    if (type === "file") {
      insertPageStmt.run({
        node_id: node.id,
        content_json: JSON.stringify(normalizeBlocks()),
        created_at: timestamp,
        updated_at: timestamp
      });
    }
  });
  transaction();

  return node;
}

export function updateNode(
  id: string,
  payload: { name?: string; parentId?: string | null; orderedIds?: string[] }
) {
  const existing = getNode(id);
  if (!existing) {
    return null;
  }

  const transaction = db.transaction(() => {
    if (typeof payload.name === "string" && payload.name.trim()) {
      updateNodeNameStmt.run({
        id,
        name: payload.name.trim(),
        updated_at: nowIso()
      });
    }

    if (Object.prototype.hasOwnProperty.call(payload, "parentId")) {
      updateNodeParentStmt.run({
        id,
        parent_id: payload.parentId ?? null,
        updated_at: nowIso()
      });
    }

    if (payload.orderedIds && payload.orderedIds.length > 0) {
      payload.orderedIds.forEach((nodeId, index) => {
        updateSortStmt.run({
          id: nodeId,
          sort_order: index,
          updated_at: nowIso()
        });
      });
    }
  });

  transaction();
  return getNode(id);
}

export function removeNode(id: string) {
  const existing = getNode(id);
  if (!existing) {
    return false;
  }
  deleteNodeStmt.run(id);
  return true;
}

export function getPage(nodeId: string) {
  const page = getPageStmt.get(nodeId) as
    | { node_id: string; content_json: string; updated_at: string }
    | undefined;

  if (!page) {
    return {
      nodeId,
      blocks: normalizeBlocks(),
      updatedAt: null
    };
  }

  return {
    nodeId: page.node_id,
    blocks: normalizeBlocks(JSON.parse(page.content_json) as PageBlock[]),
    updatedAt: page.updated_at
  };
}

export function savePage(nodeId: string, blocks: PageBlock[]) {
  const timestamp = nowIso();
  savePageStmt.run({
    node_id: nodeId,
    content_json: JSON.stringify(normalizeBlocks(blocks)),
    created_at: timestamp,
    updated_at: timestamp
  });
  return getPage(nodeId);
}

export function appendCodeBlock(nodeId: string) {
  const page = getPage(nodeId);
  const blocks = [
    ...page.blocks,
    { id: createId("code"), type: "code" as const, language: "ts", code: "" }
  ];
  return savePage(nodeId, blocks);
}
