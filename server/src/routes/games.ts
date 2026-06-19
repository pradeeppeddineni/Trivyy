import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createGameSchema, submitAnswerSchema, gameIdSchema } from '../schemas/games';
import { resolveCurrentPlayer } from './currentPlayer';
import {
  createSoloGame,
  getGameQuestions,
  submitAnswer,
  completeGame,
  getSoloResult,
  GameError,
} from '../services/gameService';

/**
 * Solo game endpoints (spec 8). Handlers stay thin (ARC-2): validate with zod,
 * resolve the player, call the service, shape the JSON. All errors flow to the
 * central handler, which never leaks internals (API-3).
 */
export const gamesRouter = Router();

/** Map a GameError to its status; rethrow anything else to the error handler. */
function sendGameError(res: Response, err: unknown, next: NextFunction): void {
  if (err instanceof GameError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

async function requirePlayer(req: Request, res: Response): Promise<{ id: string } | null> {
  const player = await resolveCurrentPlayer(req);
  if (!player) {
    res.status(401).json({ error: 'no_session' });
    return null;
  }
  return player;
}

// POST /api/games — create a solo game, return the locked questions (no leak).
gamesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createGameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const { gameId, questions } = await createSoloGame({
      playerId: player.id,
      count: parsed.data.count,
      categorySlug: parsed.data.categorySlug,
      difficulty: parsed.data.difficulty,
    });
    res.status(201).json({ gameId, questions });
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// GET /api/games/:id/questions — the locked set, same no-leak shape.
gamesRouter.get('/:id/questions', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const questions = await getGameQuestions(id.data);
    res.json({ questions });
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// POST /api/games/:id/answers — submit one answer, graded server-side.
gamesRouter.post('/:id/answers', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    const body = submitAnswerSchema.safeParse(req.body);
    if (!id.success || !body.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const result = await submitAnswer(
      id.data,
      player.id,
      body.data.questionId,
      body.data.selectedAnswer,
      body.data.elapsedMs,
    );
    res.json(result);
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// POST /api/games/:id/complete — finalize the round, return score + total.
gamesRouter.post('/:id/complete', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const result = await completeGame(id.data, player.id);
    res.json(result);
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// GET /api/games/:id/result — score, total, and per-question review.
gamesRouter.get('/:id/result', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const result = await getSoloResult(id.data, player.id);
    res.json(result);
  } catch (err) {
    sendGameError(res, err, next);
  }
});
