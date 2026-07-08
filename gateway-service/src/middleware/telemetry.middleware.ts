import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

// Extend Express Request to include custom id
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const telemetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Assign or propagate x-request-id
  req.id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = req.id;
  res.setHeader('x-request-id', req.id);

  const startMs = Date.now();

  // 2. Attach to the finish event to log structured telemetry
  res.on('finish', () => {
    const executionTimeMs = Date.now() - startMs;
    const grievanceId = req.body?.grievanceId || req.params?.grievanceId || undefined;
    const citizenId = req.body?.citizenId || req.params?.citizenId || undefined;

    const logPayload = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      executionTimeMs,
      grievanceId,
      citizenId,
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      // Typically errors are attached to res.locals.errorMessage by error middleware, 
      // but we can just log the status and correlation payload
      logger.error('Request failed', { ...logPayload, errorMessage: res.locals.errorMessage || 'Unknown Error' });
    } else {
      logger.info('Request completed', logPayload);
    }
  });

  next();
};
