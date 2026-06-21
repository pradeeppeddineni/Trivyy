import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { postStory, listFriendStories } from '../services/storyService';

/**
 * Stories endpoints (spec Phase 2 UI overhaul, ARC-2). All routes require a
 * registered account (a session playerId). Handlers stay thin; business logic
 * lives in storyService.
 */
export const storiesRouter = Router();

/** The signed-in account id, or null. Stories require an account, not a guest. */
function accountId(req: Request): string | null {
  return req.session.playerId ?? null;
}

const postStorySchema = z.object({
  label: z.string().trim().min(1).max(80),
  detail: z.string().max(200).optional(),
});

/**
 * POST /api/stories
 * Share a badge story. Re-sharing the same label replaces the active entry
 * so the feed never shows duplicate badges for the same player.
 */
storiesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const parsed = postStorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const story = await postStory(me, parsed.data);
    res.status(201).json({ story });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stories/friends
 * Active stories from me + accepted friends, newest first, with poster metadata.
 */
storiesRouter.get('/friends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = accountId(req);
    if (!me) {
      res.status(401).json({ error: 'not_signed_in' });
      return;
    }
    const stories = await listFriendStories(me);
    res.json({ stories });
  } catch (err) {
    next(err);
  }
});
