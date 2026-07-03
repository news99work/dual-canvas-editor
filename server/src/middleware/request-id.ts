import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Injects X-Request-Id into every response.
 * If the client sends one via X-Request-Id header, echoes it back.
 * Otherwise generates a UUID.
 */
export function requestId(req: Record<string, any>, res: Response, next: NextFunction): void {
  const id = (req.headers?.['x-request-id'] as string) || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
