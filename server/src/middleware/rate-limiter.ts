// ── Rate Limiter Configuration ──
import rateLimit from 'express-rate-limit';
import type { RateLimitRequestHandler } from 'express-rate-limit';

/** General API rate limit: 120 requests per minute per IP */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' },
  },
});

/** Upload rate limit: 10 uploads per minute per IP */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Upload limit reached, please try again later' },
  },
});

/** Export rate limit: 5 exports per minute per IP */
export const exportLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Export limit reached, please try again later' },
  },
});

/** Polling rate limit: 60 polls per minute per IP */
export const pollLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' },
  },
});
