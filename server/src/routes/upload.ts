// ── Upload Route ──
import { Router } from 'express';
import { uploadMiddleware, processUpload } from '../services/upload.service.js';
import { uploadMetadataSchema } from '../schemas/upload.schema.js';
import { createAsset } from '../services/asset.service.js';
import { AppError } from '../middleware/error-handler.js';
import { uploadLimiter } from '../middleware/rate-limiter.js';
import type { AssetCategory } from '../types/asset.js';

const router: import('express').Router = Router();

// POST /api/v1/upload — Upload an image file
router.post('/api/v1/upload', uploadLimiter, (req, res, next) => {
  uploadMiddleware.single('file')(req, res, async (err) => {
    if (err) return next(err);

    try {
      if (!req.file) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'No file provided. Use multipart field "file".',
        );
      }

      // Parse metadata fields
      const metaResult = uploadMetadataSchema.safeParse({
        category: req.body.category || 'upload',
        tags: req.body.tags || '',
      });
      if (!metaResult.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid metadata',
          metaResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        );
      }

      const { category, tags = [] } = metaResult.data;

      // Process (validate, strip EXIF, thumbnail, uuid rename)
      const asset = await processUpload(
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        category as AssetCategory,
        tags,
      );

      // Persist metadata
      await createAsset(asset);

      res.status(201).json({ data: asset });
    } catch (e) {
      next(e);
    }
  });
});

export default router;
