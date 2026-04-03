import { db } from "./client.js";
import { sql } from "drizzle-orm";

export function runMigrations() {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS presentations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      studentName TEXT NOT NULL,
      thesisTitle TEXT NOT NULL DEFAULT '',
      displayOrder INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      ratings TEXT NOT NULL DEFAULT '{}',
      goodPoints TEXT NOT NULL DEFAULT '[]',
      issues TEXT NOT NULL DEFAULT '[]',
      actionPlans TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}
