import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "../api/sessions";

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: sessionsApi.list,
  });
}

export function useSession(id: number | null) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => sessionsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; date?: string; title?: string }) =>
      sessionsApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["sessions", vars.id] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
