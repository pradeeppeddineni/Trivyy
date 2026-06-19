import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { decideMatch } from '../domain/scoring';
import { pickQuestions, type DifficultyFilter } from './questionService';
import {
  GameError,
  getSoloResult,
  toClientQuestion,
  type ClientQuestion,
  type ReviewRow,
} from './gameService';
import { insertCodedGame } from './gameRepo';

/**
 * Async duel orchestration (spec §4.2). The creator plays a locked question set
 * first and shares a code; an opponent joins by code and plays the same set.
 * The head-to-head outcome is derived from the two final scores via the pure
 * `decideMatch` (ARC-1). No Express types here (ARC-2).
 */

export interface CreateDuelOptions {
  readonly playerId: string;
  readonly count: number;
  readonly categorySlug?: string;
  readonly difficulty?: DifficultyFilter;
}

export interface CreateDuelResult {
  readonly gameId: string;
  readonly code: string;
  readonly questions: ReadonlyArray<ClientQuestion>;
}

/** Create a duel: lock the question set, mint a code, seat the creator. */
export async function createDuel(options: CreateDuelOptions): Promise<CreateDuelResult> {
  const { playerId, count, categorySlug, difficulty } = options;

  const picked = await pickQuestions({ playerId, count, categorySlug, difficulty });
  if (picked.length === 0) {
    throw new GameError('no_questions_available', 422);
  }
  const questionIds = picked.map((q) => q.id);
  const normalizedDifficulty = difficulty && difficulty !== 'any' ? difficulty : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { gameId, code } = await insertCodedGame(client, {
      mode: 'duel',
      category: categorySlug ?? null,
      difficulty: normalizedDifficulty,
      questionIds,
      hostPlayerId: null,
    });
    await client.query(
      `INSERT INTO game_players (game_id, player_id, role, status)
       VALUES ($1, $2, 'creator', 'playing')`,
      [gameId, playerId],
    );
    await client.query(
      `INSERT INTO events (game_id, type, payload) VALUES ($1, 'duel_created', $2)`,
      [gameId, JSON.stringify({ playerId, code, count: questionIds.length })],
    );
    await client.query('COMMIT');
    logger.info('duel_created', { gameId, count: questionIds.length });
    return { gameId, code, questions: picked.map(toClientQuestion) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface JoinDuelResult {
  readonly gameId: string;
  readonly questions: ReadonlyArray<ClientQuestion>;
}

/**
 * Join a duel by code as the opponent. Rejects unknown/closed codes, the
 * creator re-joining their own duel, and a third player (a duel is two-player).
 * Returns the same locked question set the creator played.
 */
export async function joinDuel(code: string, playerId: string): Promise<JoinDuelResult> {
  const game = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM games WHERE game_code = $1 AND mode = 'duel'`,
    [code],
  );
  if (game.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  const gameId = game.rows[0].id;

  const players = await pool.query<{ player_id: string }>(
    `SELECT player_id FROM game_players WHERE game_id = $1`,
    [gameId],
  );
  if (players.rows.some((row) => row.player_id === playerId)) {
    // Idempotent: the creator (or an opponent reloading) just gets the set back.
    return { gameId, questions: await loadClientQuestions(gameId) };
  }
  if (players.rows.length >= 2) {
    throw new GameError('duel_full', 409);
  }

  try {
    await pool.query(
      `INSERT INTO game_players (game_id, player_id, role, status)
       VALUES ($1, $2, 'opponent', 'playing')`,
      [gameId, playerId],
    );
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
      throw new GameError('duel_full', 409);
    }
    throw err;
  }
  await pool.query(`INSERT INTO events (game_id, type, payload) VALUES ($1, 'duel_joined', $2)`, [
    gameId,
    JSON.stringify({ playerId }),
  ]);
  logger.info('duel_joined', { gameId });
  return { gameId, questions: await loadClientQuestions(gameId) };
}

export interface DuelSide {
  readonly nickname: string;
  readonly score: number | null;
}

export type DuelOutcome = 'win' | 'loss' | 'draw';

export interface DuelResult {
  readonly mode: 'duel';
  readonly status: 'waiting' | 'complete';
  readonly total: number;
  readonly you: DuelSide;
  readonly opponent: DuelSide | null;
  /** Outcome from the requesting player's perspective; null until both finish. */
  readonly outcome: DuelOutcome | null;
  readonly review: ReadonlyArray<ReviewRow>;
}

/**
 * The duel result from the requesting player's perspective. Polled by the
 * waiting screen (API-7): `status` is `waiting` until both players are done,
 * then `complete` with the opponent's score and the decided outcome revealed.
 */
export async function getDuelResult(gameId: string, playerId: string): Promise<DuelResult> {
  const rows = await pool.query<{
    player_id: string;
    status: string;
    score: number;
    nickname: string;
  }>(
    `SELECT gp.player_id, gp.status, gp.score, p.nickname
       FROM game_players gp JOIN players p ON p.id = gp.player_id
      WHERE gp.game_id = $1`,
    [gameId],
  );
  if (rows.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  const you = rows.rows.find((row) => row.player_id === playerId);
  if (!you) {
    throw new GameError('not_in_game', 403);
  }
  const opp = rows.rows.find((row) => row.player_id !== playerId) ?? null;

  // The requesting player's own score + per-question review (reuses solo logic).
  const mine = await getSoloResult(gameId, playerId);
  const bothDone = rows.rows.length === 2 && rows.rows.every((row) => row.status === 'done');

  let outcome: DuelOutcome | null = null;
  if (bothDone && opp) {
    const match = decideMatch(mine.score, opp.score);
    outcome = match.outcome === 'draw' ? 'draw' : match.winner === 'a' ? 'win' : 'loss';
  }

  return {
    mode: 'duel',
    status: bothDone ? 'complete' : 'waiting',
    total: mine.total,
    you: { nickname: you.nickname, score: mine.score },
    opponent: opp ? { nickname: opp.nickname, score: bothDone ? opp.score : null } : null,
    outcome,
    review: mine.review,
  };
}

// ---- internals ----

/** The locked question set as no-leak client questions, in stored order. */
async function loadClientQuestions(gameId: string): Promise<ReadonlyArray<ClientQuestion>> {
  const game = await pool.query<{ question_ids: string[] }>(
    `SELECT question_ids FROM games WHERE id = $1`,
    [gameId],
  );
  if (game.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  const ids = game.rows[0].question_ids;
  const result = await pool.query<{
    id: string;
    text: string;
    correct_answer: string;
    incorrect_answers: string[];
    difficulty: string;
    category_label: string | null;
    category_icon: string | null;
  }>(
    `SELECT q.id, q.text, q.correct_answer, q.incorrect_answers, q.difficulty,
            c.label AS category_label, c.icon AS category_icon
       FROM unnest($1::uuid[]) WITH ORDINALITY AS k(id, ord)
       JOIN questions q ON q.id = k.id
       LEFT JOIN categories c ON c.id = q.category_id
      ORDER BY k.ord`,
    [ids],
  );
  return result.rows.map(toClientQuestion);
}
