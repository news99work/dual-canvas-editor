// ── Fonts Route ──
import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { config } from '../config.js';

const router: import('express').Router = Router();

// GET /api/v1/fonts — List available fonts
router.get('/api/v1/fonts', async (_req, res, next) => {
  try {
    const data = await readFile(config.fontsJsonPath, 'utf-8');
    const fonts = JSON.parse(data);
    res.json({ data: fonts });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.json({ data: [] });
      return;
    }
    next(err);
  }
});

export default router;
