import type { Request, Response, NextFunction } from 'express';

/**
 * Authorization enforced at the API layer (SEC-2). Frontend checks are UX only;
 * this guard is the real boundary for admin-only routes.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ error: 'unauthorized' });
}
