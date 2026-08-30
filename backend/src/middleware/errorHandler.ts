import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const correlationId = uuidv4();
  console.error(`[Error] [${correlationId}]`, err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred while processing the request.',
      details: err.details,
      correlation_id: correlationId,
    },
  });
}
