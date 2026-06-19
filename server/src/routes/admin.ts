import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import type { Env } from '../config/env';
import { requireAdmin } from '../middleware/auth';
import { getAdminStats } from '../services/statsService';

const loginSchema = z.object({
  password: z.string().min(1, 'password is required'),
});

/**
 * Single-admin auth (spec 8, /api/admin/*). The password is verified against an
 * argon2 hash from the environment — the plaintext is never stored (SEC-1).
 * We use a vetted library rather than rolling our own crypto.
 */
export function adminRouter(env: Env): Router {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      const ok = await argon2.verify(env.ADMIN_PASSWORD_HASH, parsed.data.password);
      if (!ok) {
        res.status(401).json({ error: 'invalid_credentials' });
        return;
      }
      req.session.isAdmin = true;
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.json({ ok: true });
  });

  router.get('/whoami', requireAdmin, (_req, res) => {
    res.json({ role: 'admin' });
  });

  // Admin analytics dashboard data (OBS-3): games, players, answer
  // distributions, response times, most-missed questions — all derived on read
  // from the gameplay tables and the events audit trail.
  router.get('/stats', requireAdmin, async (_req, res, next) => {
    try {
      res.json(await getAdminStats());
    } catch (err) {
      next(err);
    }
  });

  return router;
}
