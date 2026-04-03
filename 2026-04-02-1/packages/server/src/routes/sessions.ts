import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { sessions, presentations } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import type { Presentation as PresentationType } from "@seminar/shared";

function parsePresentation(row: typeof presentations.$inferSelect): PresentationType {
  return {
    ...row,
    ratings: JSON.parse(row.ratings),
    goodPoints: JSON.parse(row.goodPoints),
    issues: JSON.parse(row.issues),
    actionPlans: JSON.parse(row.actionPlans),
  };
}

export async function sessionRoutes(app: FastifyInstance) {
  // List all sessions
  app.get("/api/sessions", async () => {
    const rows = db.select().from(sessions).orderBy(desc(sessions.date)).all();
    return rows;
  });

  // Create session
  app.post<{ Body: { date: string; title?: string } }>("/api/sessions", async (req, reply) => {
    const now = new Date().toISOString();
    const result = db
      .insert(sessions)
      .values({
        date: req.body.date,
        title: req.body.title ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    reply.code(201);
    return result;
  });

  // Get session with presentations
  app.get<{ Params: { id: string } }>("/api/sessions/:id", async (req, reply) => {
    const session = db
      .select()
      .from(sessions)
      .where(eq(sessions.id, Number(req.params.id)))
      .get();

    if (!session) {
      reply.code(404);
      return { error: "Session not found" };
    }

    const presRows = db
      .select()
      .from(presentations)
      .where(eq(presentations.sessionId, session.id))
      .orderBy(presentations.displayOrder)
      .all();

    return {
      ...session,
      presentations: presRows.map(parsePresentation),
    };
  });

  // Update session
  app.patch<{ Params: { id: string }; Body: { date?: string; title?: string } }>(
    "/api/sessions/:id",
    async (req, reply) => {
      const now = new Date().toISOString();
      const result = db
        .update(sessions)
        .set({ ...req.body, updatedAt: now })
        .where(eq(sessions.id, Number(req.params.id)))
        .returning()
        .get();

      if (!result) {
        reply.code(404);
        return { error: "Session not found" };
      }
      return result;
    }
  );

  // Delete session
  app.delete<{ Params: { id: string } }>("/api/sessions/:id", async (req, reply) => {
    db.delete(sessions).where(eq(sessions.id, Number(req.params.id))).run();
    reply.code(204).send();
  });
}
