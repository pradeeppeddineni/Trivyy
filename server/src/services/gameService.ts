import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { scoreRound } from '../domain/scoring';
import { buildChoices, seededRng } from '../domain/choices';
import { pickQuestions, type DifficultyFilter } from './questionService';

/**
 * Solo game orchestration (spec 4.1). Queries Postgres; holds no Express types
 * (ARC-2). Scoring uses the pure `scoreRound` (ARC-1). The correct answer is
 * resolved server-side on every submission and never sent in a question payload.
 */

/** A question as served to the client: no correct-answer flag (no leak). */
export interface ClientQuestion {
  readonly id: string;
  readonly text: string;
  readonly category: string | null;
  readonly categoryIcon: string | null;
  readonly difficulty: string;
  readonly choices: ReadonlyArray<string>;
}

export interface CreateSoloGameOptions {
  readonly playerId: string;
  readonly count: number;
  readonly categorySlug?: string;
  readonly difficulty?: DifficultyFilter;
}

export interface CreateSoloGameResult {
  readonly gameId: string;
  readonly questions: ReadonlyArray<ClientQuestion>;
}

/**
 * Create a solo game with a locked question set (API-6) and the player's
 * game_players row, then return the no-leak question payload for the client.
 */
export async function createSoloGame(
  options: CreateSoloGameOptions,
): Promise<CreateSoloGameResult> {
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
    const game = await client.query<{ id: string }>(
      `INSERT INTO games (mode, category, difficulty, num_questions, question_ids, status, host_player_id)
       VALUES ('solo', $1, $2, $3, $4, 'in_progress', $5)
       RETURNING id`,
      [categorySlug ?? null, normalizedDifficulty, questionIds.length, questionIds, playerId],
    );
    const gameId = game.rows[0].id;
    await client.query(
      `INSERT INTO game_players (game_id, player_id, role, status)
       VALUES ($1, $2, 'creator', 'playing')`,
      [gameId, playerId],
    );
    await client.query(
      `INSERT INTO events (game_id, type, payload) VALUES ($1, 'solo_game_created', $2)`,
      [gameId, JSON.stringify({ playerId, count: questionIds.length })],
    );
    await client.query('COMMIT');
    logger.info('solo_game_created', { gameId, count: questionIds.length });
    return { gameId, questions: picked.map(toClientQuestion) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Fetch the locked question set for a game in its stored order (no leak). */
export async function getGameQuestions(gameId: string): Promise<ReadonlyArray<ClientQuestion>> {
  const game = await loadGame(gameId);
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
       FROM questions q
       LEFT JOIN categories c ON c.id = q.category_id
      WHERE q.id = ANY($1)`,
    [game.question_ids],
  );
  const byId = new Map(result.rows.map((row) => [row.id, row]));
  return game.question_ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map(toClientQuestion);
}

export interface SubmitAnswerResult {
  readonly correct: boolean;
  readonly correctAnswer: string;
}

/**
 * Grade one answer server-side and persist it (API-5). The correct answer is
 * looked up from the question; `is_correct` is computed here, never trusted from
 * the client. Re-submitting the same question is idempotent (no double rows).
 */
export async function submitAnswer(
  gameId: string,
  playerId: string,
  questionId: string,
  selectedAnswer: string,
  elapsedMs?: number,
): Promise<SubmitAnswerResult> {
  const game = await loadGame(gameId);
  if (!game.question_ids.includes(questionId)) {
    throw new GameError('question_not_in_game', 400);
  }
  const question = await pool.query<{ correct_answer: string }>(
    `SELECT correct_answer FROM questions WHERE id = $1`,
    [questionId],
  );
  if (question.rows.length === 0) {
    throw new GameError('question_not_found', 404);
  }
  const correctAnswer = question.rows[0].correct_answer;
  const correct = selectedAnswer === correctAnswer;

  await pool.query(
    `INSERT INTO answers (game_id, player_id, question_id, selected_answer, is_correct, elapsed_ms)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [gameId, playerId, questionId, selectedAnswer, correct, elapsedMs ?? null],
  );
  // Record the interaction in the audit trail the admin dashboard reads
  // (DB-5, OBS-3) and emit a traceable structured log line (OBS-1, OBS-2).
  await pool.query(
    `INSERT INTO events (game_id, type, payload) VALUES ($1, 'answer_submitted', $2)`,
    [gameId, JSON.stringify({ playerId, questionId, correct, elapsedMs: elapsedMs ?? null })],
  );
  logger.info('answer_submitted', { gameId, correct });
  return { correct, correctAnswer };
}

export interface CompleteGameResult {
  readonly score: number;
  readonly total: number;
}

/**
 * Finalize a player's solo round: tally with the pure `scoreRound`, write the
 * score + completion onto game_players, and mark the game complete.
 */
export async function completeGame(gameId: string, playerId: string): Promise<CompleteGameResult> {
  const game = await loadGame(gameId);
  const answers = await pool.query<{ is_correct: boolean }>(
    `SELECT is_correct FROM answers WHERE game_id = $1 AND player_id = $2`,
    [gameId, playerId],
  );
  const score = scoreRound(answers.rows.map((row) => ({ correct: row.is_correct })));
  const total = game.question_ids.length;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE game_players
          SET score = $1, status = 'done', completed_at = now()
        WHERE game_id = $2 AND player_id = $3`,
      [score, gameId, playerId],
    );
    // The game is complete only once every player has finished — for solo that
    // is immediately (one player), for duel/group when the last one finishes.
    const pending = await client.query(
      `SELECT 1 FROM game_players WHERE game_id = $1 AND status <> 'done' LIMIT 1`,
      [gameId],
    );
    if (pending.rows.length === 0) {
      await client.query(`UPDATE games SET status = 'complete' WHERE id = $1`, [gameId]);
    }
    await client.query(
      `INSERT INTO events (game_id, type, payload) VALUES ($1, 'game_completed', $2)`,
      [gameId, JSON.stringify({ playerId, score, total })],
    );
    await client.query('COMMIT');
    logger.info('game_completed', { gameId, score, total });
    return { score, total };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface ReviewRow {
  readonly question: string;
  readonly your: string | null;
  readonly correct: string;
  readonly isCorrect: boolean;
}

export interface SoloResult {
  readonly score: number;
  readonly total: number;
  readonly review: ReadonlyArray<ReviewRow>;
}

/** Score, total, and the per-question review for a finished solo game. */
export async function getSoloResult(gameId: string, playerId: string): Promise<SoloResult> {
  const game = await loadGame(gameId);
  // Read in the locked question order via WITH ORDINALITY so the review matches
  // the order the player saw the questions (API-6).
  const ordered = await pool.query<{
    id: string;
    text: string;
    correct_answer: string;
    selected_answer: string | null;
    is_correct: boolean | null;
  }>(
    `SELECT q.id, q.text, q.correct_answer, a.selected_answer, a.is_correct
       FROM unnest($3::uuid[]) WITH ORDINALITY AS ids(id, ord)
       JOIN questions q ON q.id = ids.id
       LEFT JOIN answers a
         ON a.question_id = q.id AND a.game_id = $1 AND a.player_id = $2
      ORDER BY ids.ord`,
    [gameId, playerId, game.question_ids],
  );
  const review: ReviewRow[] = ordered.rows.map((row) => ({
    question: row.text,
    your: row.selected_answer,
    correct: row.correct_answer,
    isCorrect: row.is_correct === true,
  }));
  const score = review.filter((row) => row.isCorrect).length;
  return { score, total: game.question_ids.length, review };
}

// ---- internals ----

interface GameRow {
  readonly id: string;
  readonly question_ids: string[];
  readonly status: string;
}

/** Domain error carrying an HTTP status so routes can map it cleanly (API-3). */
export class GameError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'GameError';
    this.status = status;
  }
}

async function loadGame(gameId: string): Promise<GameRow> {
  const result = await pool.query<GameRow>(
    `SELECT id, question_ids, status FROM games WHERE id = $1`,
    [gameId],
  );
  if (result.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  return result.rows[0];
}

export function toClientQuestion(row: {
  id: string;
  text: string;
  correct_answer: string;
  incorrect_answers: ReadonlyArray<string>;
  difficulty: string;
  category_label?: string | null;
  category_icon?: string | null;
}): ClientQuestion {
  return {
    id: row.id,
    text: row.text,
    category: row.category_label ?? null,
    categoryIcon: row.category_icon ?? null,
    difficulty: row.difficulty,
    // Seed the shuffle by question id so the option order is identical on every
    // serve — same for both duel players and any re-fetch (API-6).
    choices: buildChoices(row.correct_answer, row.incorrect_answers, seededRng(row.id)),
  };
}
