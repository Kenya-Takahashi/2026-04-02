import type { Presentation, Ratings, ActionPlan } from "@seminar/shared";
import { api } from "./client";

export const presentationsApi = {
  create: (sessionId: number, data: { studentName: string; thesisTitle?: string }) =>
    api.post<Presentation>(`/sessions/${sessionId}/presentations`, data),
  update: (
    id: number,
    data: Partial<{
      studentName: string;
      thesisTitle: string;
      displayOrder: number;
      notes: string;
      ratings: Ratings;
      goodPoints: string[];
      issues: string[];
      actionPlans: ActionPlan[];
    }>
  ) => api.patch<Presentation>(`/presentations/${id}`, data),
  saveNotes: (id: number, notes: string) =>
    api.patch<{ ok: true }>(`/presentations/${id}/notes`, { notes }),
  saveRatings: (id: number, ratings: Ratings) =>
    api.patch<{ ok: true }>(`/presentations/${id}/ratings`, { ratings }),
  delete: (id: number) => api.del(`/presentations/${id}`),
};
