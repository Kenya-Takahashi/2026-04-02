import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { presentations } from "../db/schema.js";
import { eq } from "drizzle-orm";
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

export async function presentationRoutes(app: FastifyInstance) {
  // Add presentation to session
  app.post<{ Params: { sessionId: string }; Body: { studentName: string; thesisTitle?: string } }>(
    "/api/sessions/:sessionId/presentations",
    async (req, reply) => {
      const now = new Date().toISOString();
      const sessionId = Number(req.params.sessionId);

      // Get next display order
      const existing = db
        .select()
        .from(presentations)
        .where(eq(presentations.sessionId, sessionId))
        .all();

      const result = db
        .insert(presentations)
        .values({
          sessionId,
          studentName: req.body.studentName,
          thesisTitle: req.body.thesisTitle ?? "",
          displayOrder: existing.length,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();

      reply.code(201);
      return parsePresentation(result);
    }
  );

  // Update presentation (general)
  app.patch<{
    Params: { id: string };
    Body: Partial<{
      studentName: string;
      thesisTitle: string;
      displayOrder: number;
      notes: string;
      ratings: Record<string, number>;
      goodPoints: string[];
      issues: string[];
      actionPlans: Array<{ text: string; priority: string }>;
    }>;
  }>("/api/presentations/:id", async (req, reply) => {
    const now = new Date().toISOString();
    const { ratings, goodPoints, issues, actionPlans, ...rest } = req.body;

    const updateData: Record<string, unknown> = { ...rest, updatedAt: now };
    if (ratings !== undefined) updateData.ratings = JSON.stringify(ratings);
    if (goodPoints !== undefined) updateData.goodPoints = JSON.stringify(goodPoints);
    if (issues !== undefined) updateData.issues = JSON.stringify(issues);
    if (actionPlans !== undefined) updateData.actionPlans = JSON.stringify(actionPlans);

    const result = db
      .update(presentations)
      .set(updateData)
      .where(eq(presentations.id, Number(req.params.id)))
      .returning()
      .get();

    if (!result) {
      reply.code(404);
      return { error: "Presentation not found" };
    }
    return parsePresentation(result);
  });

  // Auto-save notes
  app.patch<{ Params: { id: string }; Body: { notes: string } }>(
    "/api/presentations/:id/notes",
    async (req, reply) => {
      const now = new Date().toISOString();
      db.update(presentations)
        .set({ notes: req.body.notes, updatedAt: now })
        .where(eq(presentations.id, Number(req.params.id)))
        .run();
      return { ok: true };
    }
  );

  // Auto-save ratings
  app.patch<{ Params: { id: string }; Body: { ratings: Record<string, number> } }>(
    "/api/presentations/:id/ratings",
    async (req, reply) => {
      const now = new Date().toISOString();
      db.update(presentations)
        .set({ ratings: JSON.stringify(req.body.ratings), updatedAt: now })
        .where(eq(presentations.id, Number(req.params.id)))
        .run();
      return { ok: true };
    }
  );

  // Delete presentation
  app.delete<{ Params: { id: string } }>("/api/presentations/:id", async (req, reply) => {
    db.delete(presentations).where(eq(presentations.id, Number(req.params.id))).run();
    reply.code(204).send();
  });
}
