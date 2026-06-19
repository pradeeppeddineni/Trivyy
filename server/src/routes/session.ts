import { Router } from 'express';
import { nicknameSchema } from '../schemas/session';

export const sessionRouter = Router();

/**
 * Set or update the player's nickname and issue a browser session (spec 8,
 * POST /api/session). A player needs no account (SEC-3) — identity is a
 * nickname plus the signed session cookie.
 */
sessionRouter.post('/session', (req, res) => {
  const parsed = nicknameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_nickname' });
    return;
  }
  req.session.nickname = parsed.data.nickname;
  res.status(200).json({ nickname: parsed.data.nickname });
});

/** Current player info (spec 8, GET /api/me). */
sessionRouter.get('/me', (req, res) => {
  if (!req.session.nickname) {
    res.status(401).json({ error: 'no_session' });
    return;
  }
  res.json({ nickname: req.session.nickname });
});
