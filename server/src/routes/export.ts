// ── Export Route ──
import { Router } from 'express';
import { exportRequestSchema } from '../schemas/export-request.schema.js';
import { startExport, getJob } from '../services/export.service.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error-handler.js';
import { exportLimiter, pollLimiter } from '../middleware/rate-limiter.js';

const router: import('express').Router = Router();

// POST /api/v1/export — Trigger an export (idempotent)
router.post(
  '/api/v1/export',
  exportLimiter,
  validate({ body: exportRequestSchema }),
  async (req, res, next) => {
    try {
      const { canvasState, format, quality } = req.body as {
        canvasState: unknown;
        format: 'png' | 'pdf' | 'both';
        quality: 'draft' | 'standard' | 'high';
      };

      const { job, isNew } = await startExport(canvasState, format, quality);

      res.status(isNew ? 202 : 200).json({
        data: job,
      });
    } catch (err: any) {
      if (err.statusCode) {
        next(new AppError(err.statusCode, err.code || 'EXPORT_ERROR', err.message, err.details));
      } else {
        next(err);
      }
    }
  },
);

// GET /api/v1/export/:id — Poll export status
router.get('/api/v1/export/:id', pollLimiter, async (req, res, next) => {
  try {
    const jobId = req.params.id as string;
    const job = getJob(jobId);
    if (!job) {
      throw new AppError(404, 'NOT_FOUND', 'Export job not found');
    }

    res.json({ data: job });
  } catch (err) {
    next(err);
  }
});

export default router;
