// ── Cleanup Service — Temp file purge cron ──
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { purgeExpiredJobs } from './export.service.js';

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the cleanup interval that:
 * - Removes export files older than retention period
 * - Removes upload temp files older than retention period
 * - Purges expired export jobs from memory
 */
export function startCleanupCron(): void {
  if (intervalHandle) return;

  intervalHandle = setInterval(async () => {
    const now = Date.now();
    const cutoff = now - config.tempFileTtlMs;
    let deletedCount = 0;

    try {
      // Clean exports directory
      const exportFiles = await fs.readdir(config.exportsDir).catch(() => []);
      for (const file of exportFiles) {
        const filePath = path.join(config.exportsDir, file);
        try {
          const stat = await fs.stat(filePath);
          if (stat.mtimeMs < cutoff) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch {
          // Skip files that fail stat/unlink
        }
      }

      // Clean uploads directory (thumbnails + originals)
      const uploadFiles = await fs.readdir(config.uploadsDir).catch(() => []);
      for (const file of uploadFiles) {
        const filePath = path.join(config.uploadsDir, file);
        try {
          const stat = await fs.stat(filePath);
          if (stat.mtimeMs < cutoff) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch {
          // Skip
        }
      }

      // Purge expired export jobs from memory
      const purgedJobs = purgeExpiredJobs();

      if (deletedCount > 0 || purgedJobs > 0) {
        console.log(
          `[cleanup] Deleted ${deletedCount} temp files, purged ${purgedJobs} expired jobs`,
        );
      }
    } catch (err) {
      console.error('[cleanup] Error during cleanup cycle:', err);
    }
  }, config.cleanupIntervalMs);

  console.log(
    `[cleanup] Cron started (interval: ${config.cleanupIntervalMs}ms, TTL: ${config.tempFileTtlMs}ms)`,
  );
}

/** Stops the cleanup cron */
export function stopCleanupCron(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[cleanup] Cron stopped');
  }
}
