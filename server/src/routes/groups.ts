import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GameError } from '../services/gameService';
import {
  createGroup,
  joinGroup,
  listMyGroups,
  getGroup,
  getStandings,
} from '../services/groupClubService';
import { uuidSchema } from '../schemas/admin';

/**
 * Persistent groups (spec v3 §13.3, /api/groups/*). All routes require a
 * registered account. Handlers stay thin (ARC-2).
 */
export const groupsRouter = Router();

function sendError(res: Response, err: unknown, next: NextFunction): void {
  if (err instanceof GameError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

function accountId(req: Request): string | null {
  return req.session.playerId ?? null;
}

const createSchema = z.object({ name: z.string().trim().min(1).max(40) });
const joinSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/i),
});

groupsRouter.post('/', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    res.status(201).json(await createGroup(me, parsed.data.name));
  } catch (err) {
    sendError(res, err, next);
  }
});

groupsRouter.get('/', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    res.json({ groups: await listMyGroups(me) });
  } catch (err) {
    sendError(res, err, next);
  }
});

groupsRouter.post('/join', async (req, res, next) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    res.json(await joinGroup(me, parsed.data.code));
  } catch (err) {
    sendError(res, err, next);
  }
});

groupsRouter.get('/:id', async (req, res, next) => {
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
    res.json(await getGroup(me, id.data));
  } catch (err) {
    sendError(res, err, next);
  }
});

groupsRouter.get('/:id/standings', async (req, res, next) => {
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
    res.json({ entries: await getStandings(me, id.data) });
  } catch (err) {
    sendError(res, err, next);
  }
});
