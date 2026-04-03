import type { Session, SessionWithPresentations } from "@seminar/shared";
import { api } from "./client";

export const sessionsApi = {
  list: () => api.get<Session[]>("/sessions"),
  get: (id: number) => api.get<SessionWithPresentations>(`/sessions/${id}`),
  create: (data: { date: string; title?: string }) =>
    api.post<Session>("/sessions", data),
  update: (id: number, data: { date?: string; title?: string }) =>
    api.patch<Session>(`/sessions/${id}`, data),
  delete: (id: number) => api.del(`/sessions/${id}`),
};
