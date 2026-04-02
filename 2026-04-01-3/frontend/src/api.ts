import type { NodeItem, PageBlock, PageData } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message || `Request failed: ${response.status}`);
    } catch {
      throw new Error(text || `Request failed: ${response.status}`);
    }
  }

  return response.json() as Promise<T>;
}

export function fetchTree() {
  return request<{ nodes: NodeItem[] }>("/nodes/tree");
}

export function createNode(payload: { parentId: string | null; type: "folder" | "file" }) {
  return request<{ node: NodeItem }>("/nodes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateNode(
  id: string,
  payload: Partial<{
    name: string;
    parentId: string | null;
    orderedIds: string[];
  }>
) {
  return request<{ node: NodeItem }>(`/nodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteNode(id: string) {
  return request<{ success: boolean }>(`/nodes/${id}`, {
    method: "DELETE"
  });
}

export function fetchPage(nodeId: string) {
  return request<PageData>(`/pages/${nodeId}`);
}

export function savePage(nodeId: string, blocks: PageBlock[]) {
  return request<PageData>(`/pages/${nodeId}`, {
    method: "PUT",
    body: JSON.stringify({ blocks })
  });
}
