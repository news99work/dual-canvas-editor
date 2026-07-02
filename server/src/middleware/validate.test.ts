// ── Validate Middleware Tests ──
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod/v4';
import { validate } from './validate.js';
import { AppError } from './error-handler.js';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive(),
});

describe('validate middleware', () => {
  it('should call next() when body passes validation', () => {
    const middleware = validate({ body: testSchema });
    const req = { body: { name: 'Alice', age: 30 } } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    // Parsed data should be assigned back
    expect(req.body.name).toBe('Alice');
  });

  it('should throw AppError when body fails validation', () => {
    const middleware = validate({ body: testSchema });
    const req = { body: { name: '', age: -5 } } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toBeDefined();
  });

  it('should call next() when query passes validation', () => {
    const querySchema = z.object({ page: z.coerce.number().int().optional() });
    const middleware = validate({ query: querySchema });
    const req = { query: { page: '2' }, body: {} } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should throw AppError when query fails validation', () => {
    const querySchema = z.object({ page: z.coerce.number().int().nonnegative() });
    const middleware = validate({ query: querySchema });
    const req = { query: { page: '-1' }, body: {} } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it('should call next() when no schemas provided', () => {
    const middleware = validate({});
    const req = { body: {} } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
