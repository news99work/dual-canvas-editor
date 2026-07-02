// ── Dual Canvas Editor — Server Configuration ──
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const config = {
  /** Server port */
  port: Number(process.env.PORT) || 4000,

  /** CORS allowed origin */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  /** Trust proxy for rate limiting behind reverse proxy */
  trustProxy: process.env.TRUST_PROXY === 'true',

  // ── Upload ──
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
  maxUploadSize: 10 * 1024 * 1024, // 10 MB

  // ── Storage ──
  uploadsDir: path.resolve(ROOT, 'uploads'),
  exportsDir: path.resolve(ROOT, 'exports'),
  assetsDir: path.resolve(ROOT, 'src', 'assets'),
  tempDir: path.resolve(ROOT, 'temp'),
  metaDir: path.resolve(ROOT, 'meta'),

  // Fonts
  fontsJsonPath: path.resolve(ROOT, 'src', 'assets', 'fonts', 'fonts.json'),

  // ── Export ──
  exportWidth: 2400,
  exportHeight: 3600,
  exportRetentionMs: 60 * 60 * 1000, // 1 hour (was 24h, reduced per security review)

  // ── Cleanup ──
  tempFileTtlMs: 60 * 60 * 1000, // 1 hour
  cleanupIntervalMs: 15 * 60 * 1000, // 15 minutes

  // ── Request body ──
  jsonBodyLimit: '5mb',
} as const;
