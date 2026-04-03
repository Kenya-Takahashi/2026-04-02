import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  title: text(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});

export const presentations = sqliteTable("presentations", {
  id: int().primaryKey({ autoIncrement: true }),
  sessionId: int()
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  studentName: text().notNull(),
  thesisTitle: text().notNull().default(""),
  displayOrder: int().notNull().default(0),
  notes: text().notNull().default(""),
  ratings: text().notNull().default("{}"),
  goodPoints: text().notNull().default("[]"),
  issues: text().notNull().default("[]"),
  actionPlans: text().notNull().default("[]"),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});
