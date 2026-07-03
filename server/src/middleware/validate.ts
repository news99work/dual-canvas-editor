// ── Zod Validation Middleware Factory ──
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod/v4';
import { AppError } from './error-handler.js';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Creates middleware that validates request parts against Zod schemas.
 * Passes parsed values back into req for downstream handlers.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
          throw new AppError(400, 'VALIDATION_ERROR', 'Request body validation failed', messages);
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Query parameter validation failed',
            messages,
          );
        }
        // Express 5: req.query is a getter — mutate the object, don't reassign
        Object.assign(req.query, result.data);
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Route parameter validation failed',
            messages,
          );
        }
        // Express 5: req.params is a getter — mutate the object, don't reassign
        Object.assign(req.params, result.data);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
