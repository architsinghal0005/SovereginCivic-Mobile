import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error instanceof Error ? 500 : 400);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  // Mask unhandled errors in production
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Only add stack traces in dev mode
  };

  if (process.env.NODE_ENV === 'development') {
    logger.error(err);
  } else {
    logger.error(err.message, { stack: err.stack, url: req.originalUrl, method: req.method, ip: req.ip });
  }

  res.status(statusCode).json(response);
};
