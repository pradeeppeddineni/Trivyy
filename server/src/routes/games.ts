import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  createGameSchema,
  submitAnswerSchema,
  gameIdSchema,
  joinGameSchema,
} from '../schemas/games';
import { resolveCurrentPlayer } from './currentPlayer';
import {
  createSoloGame,
  getGameQuestions,
  submitAnswer,
  completeGame,
  getSoloResult,
  GameError,
} from '../services/gameService';
import { createDuel, joinDuel, getDuelResult } from '../services/duelService';
import {
  createGroup,
  joinGroup,
  getLobby,
  startGroup,
  getLeaderboard,
} from '../services/groupService';
import { lookupGameByCode, lookupGameModeById } from '../services/gameRepo';

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

// POST /api/games — create a game in the requested mode and return what that
// mode needs: solo/duel get the locked questions immediately; group (host) gets
// a code and waits in the lobby (questions are fetched when the round starts).
gamesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createGameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const opts = {
      playerId: player.id,
      count: parsed.data.count,
      categorySlug: parsed.data.categorySlug,
      difficulty: parsed.data.difficulty,
      region: parsed.data.region,
    };

    if (parsed.data.mode === 'duel') {
      const { gameId, code, questions } = await createDuel(opts);
      res.status(201).json({ gameId, mode: 'duel', code, questions });
      return;
    }
    if (parsed.data.mode === 'together') {
      const { gameId, code } = await createGroup({
        ...opts,
        maxPlayers: parsed.data.maxPlayers,
        groupId: parsed.data.groupId,
      });
      res.status(201).json({ gameId, mode: 'together', code });
      return;
    }
    const { gameId, questions } = await createSoloGame(opts);
    res.status(201).json({ gameId, mode: 'solo', questions });
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// POST /api/games/join — join a duel or group game by its code. Dispatches on
// the game's mode so one entry point serves both shareable modes.
gamesRouter.post('/join', async (req, res, next) => {
  try {
    const parsed = joinGameSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const game = await lookupGameByCode(parsed.data.code);
    if (!game) {
      res.status(404).json({ error: 'game_not_found' });
      return;
    }
    if (game.mode === 'duel') {
      const { gameId, questions } = await joinDuel(parsed.data.code, player.id);
      res.json({ gameId, mode: 'duel', role: 'opponent', questions });
      return;
    }
    if (game.mode === 'together') {
      const { gameId } = await joinGroup(parsed.data.code, player.id);
      res.json({ gameId, mode: 'together', role: 'player' });
      return;
    }
    res.status(409).json({ error: 'not_joinable' });
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

// GET /api/games/:id/result — solo review, or the duel head-to-head (polled by
// the waiting screen: `status` is 'waiting' until both players finish).
gamesRouter.get('/:id/result', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    const mode = await lookupGameModeById(id.data);
    if (mode === null) {
      res.status(404).json({ error: 'game_not_found' });
      return;
    }
    const result =
      mode === 'duel'
        ? await getDuelResult(id.data, player.id)
        : await getSoloResult(id.data, player.id);
    res.json(result);
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// GET /api/games/:id/lobby — group lobby roster + status (polled, API-7).
gamesRouter.get('/:id/lobby', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    res.json(await getLobby(id.data, player.id));
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// POST /api/games/:id/start — host closes the lobby and starts the round.
gamesRouter.post('/:id/start', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    res.json(await startGroup(id.data, player.id));
  } catch (err) {
    sendGameError(res, err, next);
  }
});

// GET /api/games/:id/leaderboard — derived group ranking (polled, API-7/API-8).
gamesRouter.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const id = gameIdSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'invalid_game_id' });
      return;
    }
    const player = await requirePlayer(req, res);
    if (!player) return;

    res.json(await getLeaderboard(id.data, player.id));
  } catch (err) {
    sendGameError(res, err, next);
  }
});
