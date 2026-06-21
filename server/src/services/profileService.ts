import { pool } from '../db/pool';

/**
 * Per-player profile stats (spec v3 §13) — the player's own view of their play,
 * derived on read from their answers + game_players (API-8, no stored rollups).
 * Works for any current player (guest or registered). No Express types (ARC-2).
 */

export interface ProfileStats {
  readonly games: number;
  readonly points: number;
  readonly answers: number;
  readonly accuracyPct: number;
  readonly byCategory: ReadonlyArray<{
    readonly category: string;
    readonly answers: number;
    readonly accuracyPct: number;
  }>;
  readonly recent: ReadonlyArray<{
    readonly mode: string;
    readonly score: number;
    readonly total: number;
    readonly at: string;
  }>;
}

const num = (v: unknown): number => Number(v ?? 0);
const pct = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/** Build the profile snapshot for one player. */
export async function getPlayerStats(playerId: string): Promise<ProfileStats> {
  const [totals, answers, byCat, recent] = await Promise.all([
    pool.query(
      `SELECT count(*) FILTER (WHERE status = 'done') AS games,
              COALESCE(SUM(score), 0) AS points
         FROM game_players WHERE player_id = $1`,
      [playerId],
    ),
    pool.query(
      `SELECT count(*) AS total, count(*) FILTER (WHERE is_correct) AS correct
         FROM answers WHERE player_id = $1`,
      [playerId],
    ),
    pool.query(
      `SELECT COALESCE(c.label, 'Surprise me') AS category,
              count(*) AS answers,
              count(*) FILTER (WHERE a.is_correct) AS correct
         FROM answers a
         JOIN questions q ON q.id = a.question_id
         LEFT JOIN categories c ON c.id = q.category_id
        WHERE a.player_id = $1
        GROUP BY c.label
        ORDER BY answers DESC`,
      [playerId],
    ),
    pool.query(
      `SELECT g.mode, gp.score, g.num_questions AS total, gp.completed_at
         FROM game_players gp JOIN games g ON g.id = gp.game_id
        WHERE gp.player_id = $1 AND gp.status = 'done'
        ORDER BY gp.completed_at DESC NULLS LAST
        LIMIT 5`,
      [playerId],
    ),
  ]);

  const a = answers.rows[0];
  return {
    games: num(totals.rows[0].games),
    points: num(totals.rows[0].points),
    answers: num(a.total),
    accuracyPct: pct(num(a.correct), num(a.total)),
    byCategory: byCat.rows.map((row) => ({
      category: row.category,
      answers: num(row.answers),
      accuracyPct: pct(num(row.correct), num(row.answers)),
    })),
    recent: recent.rows.map((row) => ({
      mode: row.mode,
      score: num(row.score),
      total: num(row.total),
      at:
        row.completed_at instanceof Date
          ? row.completed_at.toISOString()
          : String(row.completed_at ?? ''),
    })),
  };
}
