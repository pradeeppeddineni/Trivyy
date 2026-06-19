import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

/**
 * Central error handler. Returns a clear, generic JSON shape and never leaks
 * stack traces, SQL, or file paths to the client (API-3, CODE-6). Details go
 * to the structured log only.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const detail = err instanceof Error ? err.message : 'unknown error';
  logger.error('unhandled_error', { detail });
  res.status(500).json({ error: 'internal_server_error' });
}
