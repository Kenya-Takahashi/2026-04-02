import { useMutation, useQueryClient } from "@tanstack/react-query";
import { presentationsApi } from "../api/presentations";
import type { Ratings, ActionPlan } from "@seminar/shared";

export function useCreatePresentation(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentName: string; thesisTitle?: string }) =>
      presentationsApi.create(sessionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useUpdatePresentation(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      studentName?: string;
      thesisTitle?: string;
      goodPoints?: string[];
      issues?: string[];
      actionPlans?: ActionPlan[];
    }) => presentationsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useSaveNotes(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      presentationsApi.saveNotes(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useSaveRatings(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ratings }: { id: number; ratings: Ratings }) =>
      presentationsApi.saveRatings(id, ratings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", sessionId] }),
  });
}

export function useDeletePresentation(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await presentationsApi.delete(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["sessions", sessionId] });
    },
    onError: (err) => {
      console.error("Delete presentation failed:", err);
    },
  });
}
