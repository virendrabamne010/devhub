import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const reqId = req.headers['x-request-id'] as string || '-';

  // Log error using Winston
  if (statusCode >= 500) {
    logger.error(`[${reqId}] ${message}`, { err: err.stack, method: req.method, path: req.originalUrl });
  } else {
    logger.warn(`[${reqId}] ${message}`, { method: req.method, path: req.originalUrl });
  }

  res.status(statusCode).json({
    error: message,
    requestId: reqId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
    requestId: req.headers['x-request-id'] || '-',
  });
}

// Trusted-error classification helper
export function isTrustedError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
