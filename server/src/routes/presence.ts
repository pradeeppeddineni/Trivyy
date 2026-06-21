import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { touch } from '../services/presenceService';

/**
 * Presence endpoint (spec Phase 2 UI overhaul, ARC-2). A lightweight periodic
 * ping from the client keeps `last_seen_at` fresh so friends see who is online.
 * Handlers stay thin; state mutation lives in presenceService.
 */
export const presenceRouter = Router();

/** The signed-in account id, or null. Presence requires an account, not a guest. */
function accountId(req: Request): string | null {
  return req.session.playerId ?? null;
}

// Generous limit: one ping every ~10 s from a client = 6/min.
// Capped at 30/min to stop automated hammering while allowing legitimate bursts.
const pingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

/**
 * POST /api/presence/ping
 * Update `last_seen_at` for the signed-in player. Returns `{ ok: true }`.
 * Gently rate-limited (30 req/min) — a silent 429 is fine for a background ping.
 */
presenceRouter.post(
  '/ping',
  pingLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = accountId(req);
      if (!me) {
        res.status(401).json({ error: 'not_signed_in' });
        return;
      }
      await touch(me);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);
