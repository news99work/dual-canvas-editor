// ── Health Route ──
import { Router } from 'express';

const router: import('express').Router = Router();

router.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'dual-canvas-editor',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
