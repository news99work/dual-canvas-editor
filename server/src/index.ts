// ── Dual Canvas Editor — Express 5 Server Entrypoint ──
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';

import { config } from './config.js';
import { generalLimiter } from './middleware/rate-limiter.js';
import { requestId } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { startCleanupCron } from './services/cleanup.service.js';

// Routes
import healthRoutes from './routes/health.js';
import uploadRoutes from './routes/upload.js';
import assetsRoutes from './routes/assets.js';
import exportRoutes from './routes/export.js';
import fontsRoutes from './routes/fonts.js';

// ── Ensure required directories exist ──
for (const dir of [config.uploadsDir, config.exportsDir, config.tempDir, config.metaDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Bootstrap Express ──
const app = express();

// Trust proxy for correct IP detection behind reverse proxy
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// ── Security middleware (early) ──
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow canvas/img fetch from CDN
  }),
);
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept', 'Accept-Language', 'X-Request-Id'],
    credentials: false,
    maxAge: 86400,
  }),
);

// ── General middleware ──
app.use(requestId);
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));

// ── Rate limiting ──
app.use('/api/', generalLimiter);
// Stricter rate limits are applied per-route in route files

// ── Storage serving ──
// More specific sub-paths registered first so exports/fonts take priority over base
app.use(
  '/api/v1/storage/exports',
  express.static(config.exportsDir, {
    dotfiles: 'deny',
    index: false,
    redirect: false,
    maxAge: '1h',
  }),
);
app.use(
  '/api/v1/storage/fonts',
  express.static(path.join(config.assetsDir, 'fonts'), {
    dotfiles: 'deny',
    index: false,
    redirect: false,
    maxAge: '30d',
  }),
);
// Base /api/v1/storage MUST be last — catches everything else under storage
app.use(
  '/api/v1/storage',
  express.static(config.uploadsDir, {
    dotfiles: 'deny',
    index: false,
    redirect: false,
    maxAge: '1d',
  }),
);

// ── Routes ──
app.use(healthRoutes);
app.use(uploadRoutes);
app.use(assetsRoutes);
app.use(exportRoutes);
app.use(fontsRoutes);

// ── Error handler (last) ──
app.use(errorHandler);

// ── Start ──
app.listen(config.port, () => {
  console.log(`🔧 Dual Canvas Editor server running at http://localhost:${config.port}`);
  console.log(`   CORS origin: ${config.corsOrigin}`);
  console.log(`   Upload size limit: ${config.maxUploadSize / 1024 / 1024} MB`);
  console.log(`   Export dimensions: ${config.exportWidth}×${config.exportHeight}`);

  // Start cleanup cron
  startCleanupCron();
});

import type { Express } from 'express';
const _app: express.Express = app;
export default _app;
