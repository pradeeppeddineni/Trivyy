import { Router } from 'express';

export const healthRouter = Router();

/** Liveness probe used by CI, Docker, and the Pi runbook. */
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
