import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { pickQuestions, type DifficultyFilter } from './questionService';
import { GameError } from './gameService';
import { insertCodedGame } from './gameRepo';

/**
 * Group "play together" orchestration (spec §4.4). A host creates a game and
 * opens a lobby; players join by code/QR and, once the host starts, each plays
 * the same locked set. The leaderboard is derived from scores (API-8) — no
 * ranking table. No Express types here (ARC-2).
 */

export interface CreateGroupOptions {
  readonly playerId: string;
  readonly count: number;
  readonly categorySlug?: string;
  readonly difficulty?: DifficultyFilter;
  /** Host-chosen lobby cap (including the host). Null = no cap. */
  readonly maxPlayers?: number;
  /** Persistent group this round belongs to, for standings (spec v3 §13.3). */
  readonly groupId?: string;
  readonly region?: string;
}

export interface CreateGroupResult {
  readonly gameId: string;
  readonly code: string;
}

/** Create a group game and seat the host; players join the open lobby next. */
export async function createGroup(options: CreateGroupOptions): Promise<CreateGroupResult> {
  const { playerId, count, categorySlug, difficulty, maxPlayers, groupId, region } = options;

  const picked = await pickQuestions({ playerId, count, categorySlug, difficulty, region });
  if (picked.length === 0) {
    throw new GameError('no_questions_available', 422);
  }
  const questionIds = picked.map((q) => q.id);
  const normalizedDifficulty = difficulty && difficulty !== 'any' ? difficulty : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { gameId, code } = await insertCodedGame(client, {
      mode: 'together',
      category: categorySlug ?? null,
      difficulty: normalizedDifficulty,
      questionIds,
      hostPlayerId: playerId,
      maxPlayers: maxPlayers ?? null,
      groupId: groupId ?? null,
    });
    await client.query(
      `INSERT INTO game_players (game_id, player_id, role, status)
       VALUES ($1, $2, 'host', 'joined')`,
      [gameId, playerId],
    );
    await client.query(
      `INSERT INTO events (game_id, type, payload) VALUES ($1, 'group_created', $2)`,
      [gameId, JSON.stringify({ playerId, code, count: questionIds.length })],
    );
    await client.query('COMMIT');
    logger.info('group_created', { gameId, count: questionIds.length });
    return { gameId, code };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Join an open group lobby by code (idempotent if already joined). */
export async function joinGroup(code: string, playerId: string): Promise<{ gameId: string }> {
  const game = await pool.query<{ id: string; status: string; max_players: number | null }>(
    `SELECT id, status, max_players FROM games WHERE game_code = $1 AND mode = 'together'`,
    [code],
  );
  if (game.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  const { id: gameId, status, max_players } = game.rows[0];

  const existing = await pool.query(
    `SELECT 1 FROM game_players WHERE game_id = $1 AND player_id = $2`,
    [gameId, playerId],
  );
  if (existing.rows.length > 0) {
    return { gameId };
  }
  if (status !== 'open') {
    throw new GameError('lobby_closed', 409);
  }
  if (max_players !== null) {
    const count = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM game_players WHERE game_id = $1`,
      [gameId],
    );
    if (Number(count.rows[0].n) >= max_players) {
      throw new GameError('lobby_full', 409);
    }
  }

  await pool.query(
    `INSERT INTO game_players (game_id, player_id, role, status)
     VALUES ($1, $2, 'player', 'joined')`,
    [gameId, playerId],
  );
  await pool.query(`INSERT INTO events (game_id, type, payload) VALUES ($1, 'group_joined', $2)`, [
    gameId,
    JSON.stringify({ playerId }),
  ]);
  logger.info('group_joined', { gameId });
  return { gameId };
}

export interface LobbyPlayer {
  readonly nickname: string;
  readonly status: string;
  readonly isHost: boolean;
  readonly score: number;
}

export interface Lobby {
  readonly code: string;
  readonly status: string;
  readonly maxPlayers: number | null;
  readonly players: ReadonlyArray<LobbyPlayer>;
}

/**
 * Reject a caller who is not a participant of this game (SEC-2): otherwise any
 * authenticated session could poll any game's roster/leaderboard by id and
 * harvest nicknames.
 */
async function assertMember(gameId: string, playerId: string): Promise<void> {
  const member = await pool.query(
    `SELECT 1 FROM game_players WHERE game_id = $1 AND player_id = $2 LIMIT 1`,
    [gameId, playerId],
  );
  if (member.rows.length === 0) {
    throw new GameError('not_in_game', 403);
  }
}

/** Lobby snapshot for the host/joiners to poll (API-7). Host listed first. */
export async function getLobby(gameId: string, playerId: string): Promise<Lobby> {
  const game = await pool.query<{
    game_code: string;
    status: string;
    host_player_id: string;
    max_players: number | null;
  }>(
    `SELECT game_code, status, host_player_id, max_players FROM games WHERE id = $1 AND mode = 'together'`,
    [gameId],
  );
  if (game.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  await assertMember(gameId, playerId);
  const { game_code, status, host_player_id, max_players } = game.rows[0];

  const players = await pool.query<{
    player_id: string;
    nickname: string;
    status: string;
    score: number;
  }>(
    `SELECT gp.player_id, p.nickname, gp.status, gp.score
       FROM game_players gp JOIN players p ON p.id = gp.player_id
      WHERE gp.game_id = $1
      ORDER BY (gp.player_id = $2) DESC, p.nickname ASC`,
    [gameId, host_player_id],
  );
  return {
    code: game_code,
    status,
    maxPlayers: max_players,
    players: players.rows.map((row) => ({
      nickname: row.nickname,
      status: row.status,
      isHost: row.player_id === host_player_id,
      score: row.score,
    })),
  };
}

/** Host-only: close the lobby and start the round. */
export async function startGroup(gameId: string, playerId: string): Promise<{ status: string }> {
  const game = await pool.query<{ status: string; host_player_id: string }>(
    `SELECT status, host_player_id FROM games WHERE id = $1 AND mode = 'together'`,
    [gameId],
  );
  if (game.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  if (game.rows[0].host_player_id !== playerId) {
    throw new GameError('not_host', 403);
  }
  if (game.rows[0].status !== 'open') {
    throw new GameError('already_started', 409);
  }
  await pool.query(`UPDATE games SET status = 'in_progress' WHERE id = $1`, [gameId]);
  await pool.query(`UPDATE game_players SET status = 'playing' WHERE game_id = $1`, [gameId]);
  await pool.query(`INSERT INTO events (game_id, type, payload) VALUES ($1, 'group_started', $2)`, [
    gameId,
    JSON.stringify({ playerId }),
  ]);
  logger.info('group_started', { gameId });
  return { status: 'in_progress' };
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly score: number;
  readonly total: number;
  readonly done: boolean;
}

export interface Leaderboard {
  readonly status: string;
  readonly total: number;
  readonly entries: ReadonlyArray<LeaderboardEntry>;
}

/**
 * Derived leaderboard ranked by score desc. Ties share a rank (standard
 * competition ranking: 5,5,3 → ranks 1,1,3). Done players first, then by score.
 */
export async function getLeaderboard(gameId: string, playerId: string): Promise<Leaderboard> {
  const game = await pool.query<{ status: string; num_questions: number }>(
    `SELECT status, num_questions FROM games WHERE id = $1 AND mode = 'together'`,
    [gameId],
  );
  if (game.rows.length === 0) {
    throw new GameError('game_not_found', 404);
  }
  await assertMember(gameId, playerId);
  const total = game.rows[0].num_questions;

  const rows = await pool.query<{ nickname: string; score: number; status: string }>(
    `SELECT p.nickname, gp.score, gp.status
       FROM game_players gp JOIN players p ON p.id = gp.player_id
      WHERE gp.game_id = $1
      ORDER BY (gp.status = 'done') DESC, gp.score DESC, p.nickname ASC`,
    [gameId],
  );

  let lastScore: number | null = null;
  let lastRank = 0;
  const entries: LeaderboardEntry[] = rows.rows.map((row, index) => {
    const done = row.status === 'done';
    // Rank only the finished players against each other; unfinished keep counting.
    const rank = lastScore !== null && row.score === lastScore ? lastRank : index + 1;
    lastScore = row.score;
    lastRank = rank;
    return { rank, nickname: row.nickname, score: row.score, total, done };
  });

  return { status: game.rows[0].status, total, entries };
}
