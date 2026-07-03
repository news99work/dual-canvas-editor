import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;

beforeAll(async () => {
  // Dynamic import to avoid TS build issues
  const mod = await import('../index.js');
  app = mod.default;
});

describe('GET /api/health', () => {
  it('returns 200 with ok:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('dual-canvas-editor');
  });
});
