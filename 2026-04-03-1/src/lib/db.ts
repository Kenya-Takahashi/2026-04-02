import "server-only";

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { initializeSchema } from "@/lib/schema";

declare global {
  // eslint-disable-next-line no-var
  var __researchFlowDb: Database.Database | undefined;
}

function resolveDatabasePath() {
  return process.env.DATABASE_PATH
    ? resolve(process.env.DATABASE_PATH)
    : resolve(process.cwd(), "data", "research-flow.db");
}

export function getDb() {
  if (!global.__researchFlowDb) {
    const databasePath = resolveDatabasePath();
    mkdirSync(dirname(databasePath), { recursive: true });

    const db = new Database(databasePath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema(db);

    global.__researchFlowDb = db;
  }

  return global.__researchFlowDb;
}
