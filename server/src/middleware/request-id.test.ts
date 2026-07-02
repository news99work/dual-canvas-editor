// ── Request ID Middleware Tests ──
import { describe, it, expect, vi } from 'vitest';
import { requestId } from './request-id.js';

describe('requestId middleware', () => {
  it('should generate a UUID when no X-Request-Id header present', () => {
    const req = { headers: {}, id: undefined } as any;
    const res = { setHeader: vi.fn() } as any;
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.id).toBeTruthy();
    expect(typeof req.id).toBe('string');
    expect(req.id.length).toBeGreaterThan(30); // UUID length
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.id);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should echo X-Request-Id header when provided by client', () => {
    const clientId = 'client-provided-id-123';
    const req = { headers: { 'x-request-id': clientId }, id: undefined } as any;
    const res = { setHeader: vi.fn() } as any;
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.id).toBe(clientId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', clientId);
  });
});
