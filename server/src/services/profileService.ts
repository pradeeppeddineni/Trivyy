import { pool } from '../db/pool';
import { levelForPoints } from '../domain/level';
import { computeAchievements } from '../domain/achievements';
import { getAvatarMeta } from './avatarService';

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
  readonly avatar: {
    readonly kind: 'none' | 'preset' | 'upload';
    readonly preset: string | null;
  };
  readonly level: {
    readonly level: number;
    readonly into: number;
    readonly span: number;
    readonly pct: number;
  };
  readonly achievements: ReadonlyArray<{
    readonly key: string;
    readonly label: string;
    readonly description: string;
    readonly earned: boolean;
  }>;
}

const num = (v: unknown): number => Number(v ?? 0);
const pct = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/** Build the profile snapshot for one player. */
export async function getPlayerStats(playerId: string): Promise<ProfileStats> {
  const [totals, answers, byCat, recent, avatarMeta] = await Promise.all([
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
    getAvatarMeta(playerId),
  ]);

  const a = answers.rows[0];
  const games = num(totals.rows[0].games);
  const points = num(totals.rows[0].points);
  const totalAnswers = num(a.total);
  const correctAnswers = num(a.correct);
  const accuracyPct = pct(correctAnswers, totalAnswers);

  return {
    games,
    points,
    answers: totalAnswers,
    accuracyPct,
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
    avatar: avatarMeta,
    level: levelForPoints(points),
    achievements: computeAchievements({
      games,
      points,
      answers: totalAnswers,
      correct: correctAnswers,
      accuracyPct,
    }),
  };
}
