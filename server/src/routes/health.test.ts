// ── Health Route Tests ──
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('GET /api/health', () => {
  it('returns 200 with ok:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('dual-canvas-editor');
    expect(res.body.version).toBe('0.1.0');
    expect(res.body).toHaveProperty('timestamp');
  });
});
