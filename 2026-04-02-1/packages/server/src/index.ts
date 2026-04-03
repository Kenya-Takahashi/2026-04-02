import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { runMigrations } from "./db/migrate.js";
import { sessionRoutes } from "./routes/sessions.js";
import { presentationRoutes } from "./routes/presentations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Run DB migrations
runMigrations();

// Register routes
await app.register(sessionRoutes);
await app.register(presentationRoutes);

// Serve static files in production
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  await app.register(fastifyStatic, { root: clientDist });
  // SPA fallback
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
  });
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  console.log(`Server running at http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
