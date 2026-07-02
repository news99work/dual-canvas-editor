// ── Export API ──
import { apiRequest } from './client';
import type { ExportJob, ExportRequest, ApiResponse } from './types';

/**
 * Trigger an export job.
 * POST /api/v1/export
 * Returns 202 (new) or 200 (idempotent hit).
 */
export async function triggerExport(request: ExportRequest): Promise<ExportJob> {
  const result = await apiRequest<ApiResponse<ExportJob>>('/api/v1/export', {
    method: 'POST',
    body: request,
    timeout: 10000, // 10s — export validation is fast
  });
  return result.data;
}

/**
 * Poll export job status.
 * GET /api/v1/export/:id
 */
export async function pollExport(jobId: string): Promise<ExportJob> {
  const result = await apiRequest<ApiResponse<ExportJob>>(`/api/v1/export/${jobId}`, {
    timeout: 5000,
  });
  return result.data;
}

/**
 * Poll helper: repeatedly check export status until done/failed.
 * Calls pollExport every `interval` ms.
 * Resolves with the completed ExportJob.
 * Rejects on failure or timeout.
 */
export async function waitForExport(
  jobId: string,
  options: { interval?: number; maxRetries?: number } = {},
): Promise<ExportJob> {
  const { interval = 2500, maxRetries = 60 } = options;
  let retries = 0;

  return new Promise<ExportJob>((resolve, reject) => {
    const poll = async () => {
      try {
        const job = await pollExport(jobId);

        if (job.status === 'done') {
          resolve(job);
          return;
        }

        if (job.status === 'failed') {
          reject(new Error(`Export failed: ${job.error || 'Unknown error'}`));
          return;
        }

        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Export timed out after ${maxRetries * interval}ms`));
          return;
        }

        setTimeout(poll, interval);
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}
