// ── Assets Route ──
import { Router } from 'express';
import { assetQuerySchema } from '../schemas/asset-query.schema.js';
import { listAssets } from '../services/asset.service.js';
import { validate } from '../middleware/validate.js';

const router: import('express').Router = Router();

// GET /api/v1/assets — List assets with filtering and pagination
router.get('/api/v1/assets', validate({ query: assetQuerySchema }), async (req, res, next) => {
  try {
    const query = req.query as unknown as {
      category?: string;
      tags?: string[];
      search?: string;
      cursor?: string;
      limit: number;
    };
    const result = await listAssets({
      category: query.category as any,
      tags: query.tags as string[] | undefined,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
