// ── Rate Limiter Configuration Tests ──
import { describe, it, expect } from 'vitest';
import { generalLimiter, uploadLimiter, exportLimiter, pollLimiter } from './rate-limiter.js';

describe('Rate limiters', () => {
  it('generalLimiter should be a function', () => {
    expect(typeof generalLimiter).toBe('function');
  });

  it('uploadLimiter should be a function', () => {
    expect(typeof uploadLimiter).toBe('function');
  });

  it('exportLimiter should be a function', () => {
    expect(typeof exportLimiter).toBe('function');
  });

  it('pollLimiter should be a function', () => {
    expect(typeof pollLimiter).toBe('function');
  });

  it('all limiters should be configured as middleware functions', () => {
    expect(typeof generalLimiter).toBe('function');
    expect(typeof uploadLimiter).toBe('function');
    expect(typeof exportLimiter).toBe('function');
    expect(typeof pollLimiter).toBe('function');
  });
});
