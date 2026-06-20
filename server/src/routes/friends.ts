import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GameError } from '../services/gameService';
import {
  searchPlayers,
  sendRequest,
  respondToRequest,
  acceptInvite,
  listFriends,
  listIncomingRequests,
  friendsLeaderboard,
} from '../services/friendService';
import { uuidSchema } from '../schemas/admin';

/**
 * Friends (spec v3 §13.2, /api/friends/*). All routes require a registered
 * account (a session playerId). Handlers stay thin (ARC-2).
 */
export const friendsRouter = Router();

function sendError(res: Response, err: unknown, next: NextFunction): void {
  if (err instanceof GameError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

/** The signed-in account id, or null (friends require an account, not a guest). */
function accountId(req: Request): string | null {
  return req.session.playerId ?? null;
}

const sendRequestSchema = z.object({ username: z.string().trim().min(1).max(20) });
// Invite codes are 5 chars from the unambiguous game-code alphabet.
const inviteCodeSchema = z
  .string()
  .trim()
  .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/i);

friendsRouter.get('/', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    res.json({ friends: await listFriends(me) });
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.get('/requests', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    res.json({ requests: await listIncomingRequests(me) });
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.get('/search', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json({ players: await searchPlayers(me, q) });
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.post('/requests', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const parsed = sendRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    res.json(await sendRequest(me, parsed.data.username));
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.post('/requests/:id/accept', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const id = uuidSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    await respondToRequest(me, id.data, true);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.post('/requests/:id/decline', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const id = uuidSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    await respondToRequest(me, id.data, false);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.post('/invite/:code', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const code = inviteCodeSchema.safeParse(req.params.code);
    if (!code.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    res.json(await acceptInvite(me, code.data));
  } catch (err) {
    sendError(res, err, next);
  }
});

friendsRouter.get('/leaderboard', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    res.json({ entries: await friendsLeaderboard(me) });
  } catch (err) {
    sendError(res, err, next);
  }
});
