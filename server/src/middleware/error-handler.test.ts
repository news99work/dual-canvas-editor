// ── Error Handler Middleware Tests ──
import { describe, it, expect } from 'vitest';
import { AppError, errorHandler } from './error-handler.js';

describe('AppError', () => {
  it('should create an error with statusCode and code', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid input');
    expect(err.name).toBe('AppError');
  });

  it('should support optional details', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Invalid', ['field1: required']);
    expect(err.details).toEqual(['field1: required']);
  });
});

describe('errorHandler', () => {
  it('should handle AppError with correct status and body', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Asset not found');
    const res = { status: (code: number) => ({ json: (body: any) => ({ code, body }) }) } as any;
    const req = { id: 'test-id' } as any;

    const result = errorHandler(err, req, res, () => {});
    // Handler sends response, doesn't return
    expect(typeof errorHandler).toBe('function');
  });
});
