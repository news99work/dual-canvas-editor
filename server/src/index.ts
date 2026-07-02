import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.PORT) || 4000;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'dual-canvas-editor', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔧 Server running at http://localhost:${PORT}`);
});
