import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { generateGameCode } from '../domain/gameCode';
import { GameError } from './gameService';

/**
 * Shared data access for coded (shareable) games — duel and group. Solo games
 * have no code, so this lives apart from createSoloGame. No Express types
 * (ARC-2).
 */

export interface InsertCodedGameParams {
  readonly mode: 'duel' | 'together';
  readonly category: string | null;
  readonly difficulty: string | null;
  readonly questionIds: ReadonlyArray<string>;
  readonly hostPlayerId: string | null;
  readonly maxPlayers?: number | null;
  /** Persistent group this game belongs to (together mode), for standings. */
  readonly groupId?: string | null;
}

const MAX_CODE_ATTEMPTS = 8;

/**
 * Insert a game row with a unique, human-shareable code, retrying on the rare
 * collision (Postgres unique-violation 23505) so the caller never has to. Runs
 * inside the caller's transaction. New coded games start `open` (joinable).
 */
export async function insertCodedGame(
  client: PoolClient,
  params: InsertCodedGameParams,
): Promise<{ gameId: string; code: string }> {
  const { mode, category, difficulty, questionIds, hostPlayerId, maxPlayers, groupId } = params;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateGameCode();
    try {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO games (mode, game_code, category, difficulty, num_questions, question_ids, status, host_player_id, max_players, group_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9)
         RETURNING id`,
        [
          mode,
          code,
          category,
          difficulty,
          questionIds.length,
          questionIds,
          hostPlayerId,
          maxPlayers ?? null,
          groupId ?? null,
        ],
      );
      return { gameId: inserted.rows[0].id, code };
    } catch (err) {
      // 23505 = unique_violation on game_code; regenerate and retry.
      if (isUniqueViolation(err)) {
        continue;
      }
      throw err;
    }
  }
  throw new GameError('could_not_allocate_game_code', 500);
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === '23505';
}

/** Resolve a code to its game id + mode so a join can dispatch to the right service. */
export async function lookupGameByCode(
  code: string,
): Promise<{ gameId: string; mode: string } | null> {
  const result = await pool.query<{ id: string; mode: string }>(
    `SELECT id, mode FROM games WHERE game_code = $1`,
    [code],
  );
  const row = result.rows[0];
  return row ? { gameId: row.id, mode: row.mode } : null;
}

/** The mode of a game by id, or null if it does not exist. */
export async function lookupGameModeById(gameId: string): Promise<string | null> {
  const result = await pool.query<{ mode: string }>(`SELECT mode FROM games WHERE id = $1`, [
    gameId,
  ]);
  return result.rows[0]?.mode ?? null;
}
