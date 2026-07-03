import type { Response, NextFunction } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Catch-all error handler — registered last in middleware chain */
export function errorHandler(
  err: Error,
  req: any,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    const body: ApiError = {
      code: err.code,
      message: isProduction && err.statusCode >= 500 ? 'An unexpected error occurred' : err.message,
    };
    if (err.details && !isProduction) {
      body.details = err.details;
    }
    res.status(err.statusCode).json({ error: body });
    return;
  }

  if (err.name === 'MulterError') {
    res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
    return;
  }

  console.error(`[${req.id || '??'}] Unhandled error:`, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message || 'Internal Server Error',
    },
  });
}
