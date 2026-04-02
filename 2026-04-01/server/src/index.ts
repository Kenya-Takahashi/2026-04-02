import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import templateRoutes from './routes/templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/templates', templateRoutes);

// Serve static files in production
// In Docker: /app/server/dist/../.. = /app → /app/client/dist
// In dev (from server/src): ../../client/dist
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
