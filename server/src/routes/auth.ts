import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, resetSchema } from '../schemas/auth';
import { register, login, resetPassword, getAccountById } from '../services/accountService';
import { GameError } from '../services/gameService';

/**
 * Optional player accounts (spec v3 §13.1, /api/auth/*). Username + argon2
 * password; one-time recovery code for reset (no email). Handlers stay thin
 * (ARC-2); login + reset are rate-limited (SEC-3a).
 */
export const authRouter = Router();

function sendError(res: Response, err: unknown, next: NextFunction): void {
  if (err instanceof GameError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

/** Issue a fresh session id (defeats session fixation when privileges change). */
function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

/** Persist the session before responding, so the client's next request sees it. */
function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

/** Regenerate, set the signed-in identity, and persist — used by register + login. */
async function startSignedInSession(
  req: Request,
  playerId: string,
  nickname: string,
): Promise<void> {
  await regenerateSession(req);
  req.session.playerId = playerId;
  req.session.nickname = nickname;
  await saveSession(req);
}

// Generous limit for a single household, strict enough to blunt guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

// POST /api/auth/register — create an account (upgrades the guest row in place);
// returns the one-time recovery code, which the client shows once.
authRouter.post('/register', authLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    // Upgrade the guest row (keyed by the current session) BEFORE regenerating.
    const { account, recoveryCode } = await register(
      req.sessionID,
      parsed.data.username,
      parsed.data.password,
      parsed.data.nickname ?? req.session.nickname,
    );
    await startSignedInSession(req, account.id, account.nickname);
    res.status(201).json({ account, recoveryCode });
  } catch (err) {
    sendError(res, err, next);
  }
});

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const account = await login(parsed.data.username, parsed.data.password);
    if (!account) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    await startSignedInSession(req, account.id, account.nickname);
    res.json({ account });
  } catch (err) {
    sendError(res, err, next);
  }
});

// POST /api/auth/logout — destroy the session entirely (becomes a fresh guest).
authRouter.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// POST /api/auth/reset — username + recovery code + new password.
authRouter.post('/reset', authLimiter, async (req, res, next) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const result = await resetPassword(
      parsed.data.username,
      parsed.data.recoveryCode,
      parsed.data.newPassword,
    );
    if (!result) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    // The old code is now invalid; return the freshly rotated one to show once.
    res.json({ ok: true, recoveryCode: result.recoveryCode });
  } catch (err) {
    sendError(res, err, next);
  }
});

// GET /api/auth/me — the signed-in account, or 401 if a guest/none.
authRouter.get('/me', async (req, res, next) => {
  try {
    if (!req.session.playerId) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const account = await getAccountById(req.session.playerId);
    if (!account) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    res.json({ account });
  } catch (err) {
    sendError(res, err, next);
  }
});
