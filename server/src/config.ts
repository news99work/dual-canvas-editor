import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 4000,

  /** Allowed image MIME types for upload */
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const,

  /** Max upload file size in bytes (10 MB) */
  maxUploadSize: 10 * 1024 * 1024,

  /** Directories */
  uploadsDir: path.resolve(ROOT, 'uploads'),
  exportsDir: path.resolve(ROOT, 'exports'),
  assetsDir: path.resolve(ROOT, 'src', 'assets'),

  fontsJsonPath: path.resolve(ROOT, 'src', 'assets', 'fonts', 'fonts.json'),

  /** Export image dimensions */
  exportWidth: 2400,
  exportHeight: 3600,

  /** Temp file TTL in ms (1 hour) */
  tempFileTtlMs: 60 * 60 * 1000,

  /** Cleanup interval in ms (15 minutes) */
  cleanupIntervalMs: 15 * 60 * 1000,

  /** Rate limiting */
  rateLimitWindowMs: 60 * 1000,
  rateLimitMax: 100,

  /** Export rate limiting (stricter) */
  exportRateLimitMax: 20,
} as const;
