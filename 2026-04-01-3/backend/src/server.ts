import Fastify from "fastify";
import cors from "@fastify/cors";
import { appendCodeBlock, createNode, getNode, getPage, listNodes, removeNode, savePage, updateNode } from "./db.js";
import type { PageBlock } from "./types.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true
});

app.get("/health", async () => ({ ok: true }));

app.get("/nodes/tree", async () => {
  const nodes = listNodes().map((node) => ({
    id: node.id,
    parentId: node.parent_id,
    type: node.type,
    name: node.name,
    sortOrder: node.sort_order,
    createdAt: node.created_at,
    updatedAt: node.updated_at
  }));
  return { nodes };
});

app.post("/nodes", async (request, reply) => {
  const body = request.body as { parentId?: string | null; type?: "folder" | "file" };
  const parentId = body.parentId ?? null;
  const type = body.type ?? "file";

  if (parentId && !getNode(parentId)) {
    return reply.code(400).send({ message: "Parent node not found" });
  }

  const node = createNode(parentId, type);
  return {
    node: {
      id: node.id,
      parentId: node.parent_id,
      type: node.type,
      name: node.name,
      sortOrder: node.sort_order,
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }
  };
});

app.patch("/nodes/:id", async (request, reply) => {
  const params = request.params as { id: string };
  const body = request.body as {
    name?: string;
    parentId?: string | null;
    orderedIds?: string[];
  };

  if (body.parentId && !getNode(body.parentId)) {
    return reply.code(400).send({ message: "Parent node not found" });
  }

  const node = updateNode(params.id, body);
  if (!node) {
    return reply.code(404).send({ message: "Node not found" });
  }

  return {
    node: {
      id: node.id,
      parentId: node.parent_id,
      type: node.type,
      name: node.name,
      sortOrder: node.sort_order,
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }
  };
});

app.delete("/nodes/:id", async (request, reply) => {
  const params = request.params as { id: string };
  const success = removeNode(params.id);
  if (!success) {
    return reply.code(404).send({ message: "Node not found" });
  }
  return { success: true };
});

app.get("/pages/:nodeId", async (request, reply) => {
  const params = request.params as { nodeId: string };
  const node = getNode(params.nodeId);
  if (!node) {
    return reply.code(404).send({ message: "Node not found" });
  }
  if (node.type !== "file") {
    return reply.code(400).send({ message: "Folders do not have page content" });
  }
  return getPage(params.nodeId);
});

app.put("/pages/:nodeId", async (request, reply) => {
  const params = request.params as { nodeId: string };
  const node = getNode(params.nodeId);
  if (!node) {
    return reply.code(404).send({ message: "Node not found" });
  }
  const body = request.body as { blocks?: PageBlock[] };
  return savePage(params.nodeId, body.blocks ?? []);
});

app.post("/pages/:nodeId/blocks", async (request, reply) => {
  const params = request.params as { nodeId: string };
  const node = getNode(params.nodeId);
  if (!node) {
    return reply.code(404).send({ message: "Node not found" });
  }
  if (node.type !== "file") {
    return reply.code(400).send({ message: "Folders do not have page content" });
  }
  return appendCodeBlock(params.nodeId);
});

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
