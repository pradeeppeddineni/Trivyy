import { pool } from '../db/pool';

/**
 * Admin analytics (OBS-3, API-8). Everything is derived on read from the
 * gameplay tables and the `events` audit trail — no denormalized stats are
 * stored. No Express types here (ARC-2).
 */

export interface AdminStats {
  readonly games: {
    readonly total: number;
    readonly solo: number;
    readonly duel: number;
    readonly together: number;
    readonly completed: number;
  };
  readonly players: number;
  readonly questions: number;
  readonly answers: number;
  readonly accuracyPct: number;
  readonly avgResponseMs: number | null;
  readonly mostMissed: ReadonlyArray<{
    readonly question: string;
    readonly attempts: number;
    readonly missed: number;
    readonly missRatePct: number;
  }>;
  readonly byCategory: ReadonlyArray<{
    readonly category: string;
    readonly answers: number;
    readonly accuracyPct: number;
  }>;
  readonly byDifficulty: ReadonlyArray<{
    readonly difficulty: string;
    readonly answers: number;
    readonly accuracyPct: number;
  }>;
  readonly recent: ReadonlyArray<{
    readonly type: string;
    readonly gameId: string | null;
    readonly at: string;
  }>;
  readonly users: {
    /** Distinct players ever seen (a player = nickname + browser session, SEC-3). */
    readonly unique: number;
    /** Players who came back for more than one game. */
    readonly returning: number;
    /** Players first seen in the last 7 days. */
    readonly newThisWeek: number;
    /** Average games per player among those who have played. */
    readonly avgGamesPerPlayer: number;
    /** Share of players who played more than once. */
    readonly repeatRatePct: number;
    readonly top: ReadonlyArray<{
      readonly nickname: string;
      readonly games: number;
      readonly best: number;
    }>;
  };
}

const num = (value: unknown): number => Number(value ?? 0);
const pct = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/** Build the full admin analytics snapshot in a handful of aggregate queries. */
export async function getAdminStats(): Promise<AdminStats> {
  const [games, players, questions, answers, missed, byCat, byDiff, recent, userAgg, topPlayers] =
    await Promise.all([
      pool.query(
        `SELECT count(*) AS total,
              count(*) FILTER (WHERE mode = 'solo') AS solo,
              count(*) FILTER (WHERE mode = 'duel') AS duel,
              count(*) FILTER (WHERE mode = 'together') AS together,
              count(*) FILTER (WHERE status = 'complete') AS completed
         FROM games`,
      ),
      pool.query(`SELECT count(*) AS n FROM players`),
      pool.query(`SELECT count(*) AS n FROM questions WHERE status = 'active'`),
      pool.query(
        `SELECT count(*) AS total,
              count(*) FILTER (WHERE is_correct) AS correct,
              avg(elapsed_ms) FILTER (WHERE elapsed_ms IS NOT NULL) AS avg_ms
         FROM answers`,
      ),
      pool.query(
        `SELECT q.text,
              count(*) AS attempts,
              count(*) FILTER (WHERE NOT a.is_correct) AS missed
         FROM answers a JOIN questions q ON q.id = a.question_id
        GROUP BY q.id, q.text
        ORDER BY (count(*) FILTER (WHERE NOT a.is_correct))::float / count(*) DESC,
                 attempts DESC
        LIMIT 5`,
      ),
      pool.query(
        `SELECT COALESCE(c.label, 'Surprise me') AS category,
              count(*) AS answers,
              count(*) FILTER (WHERE a.is_correct) AS correct
         FROM answers a
         JOIN questions q ON q.id = a.question_id
         LEFT JOIN categories c ON c.id = q.category_id
        GROUP BY c.label
        ORDER BY answers DESC`,
      ),
      pool.query(
        `SELECT q.difficulty,
              count(*) AS answers,
              count(*) FILTER (WHERE a.is_correct) AS correct
         FROM answers a JOIN questions q ON q.id = a.question_id
        GROUP BY q.difficulty
        ORDER BY answers DESC`,
      ),
      pool.query(`SELECT type, game_id, created_at FROM events ORDER BY id DESC LIMIT 10`),
      // Per-player engagement: unique / returning / new / repeat-rate. Derived
      // from the players + game_players tables — no IP or location data is stored
      // (SEC-6: logs/data hold nothing beyond nicknames and gameplay).
      pool.query(
        `WITH per AS (
         SELECT p.id, p.created_at, count(gp.id) AS games
           FROM players p LEFT JOIN game_players gp ON gp.player_id = p.id
          GROUP BY p.id, p.created_at
       )
       SELECT count(*) AS unique,
              count(*) FILTER (WHERE games > 1) AS returning,
              count(*) FILTER (WHERE created_at > now() - interval '7 days') AS new_week,
              count(*) FILTER (WHERE games > 0) AS played,
              COALESCE(avg(games) FILTER (WHERE games > 0), 0) AS avg_games
         FROM per`,
      ),
      pool.query(
        `SELECT p.nickname, count(gp.id) AS games, COALESCE(max(gp.score), 0) AS best
         FROM players p JOIN game_players gp ON gp.player_id = p.id
        GROUP BY p.id, p.nickname
        ORDER BY games DESC, best DESC
        LIMIT 5`,
      ),
    ]);

  const g = games.rows[0];
  const a = answers.rows[0];
  const u = userAgg.rows[0];
  const totalAnswers = num(a.total);
  const avgMs = a.avg_ms === null ? null : Math.round(num(a.avg_ms));

  return {
    games: {
      total: num(g.total),
      solo: num(g.solo),
      duel: num(g.duel),
      together: num(g.together),
      completed: num(g.completed),
    },
    players: num(players.rows[0].n),
    questions: num(questions.rows[0].n),
    answers: totalAnswers,
    accuracyPct: pct(num(a.correct), totalAnswers),
    avgResponseMs: avgMs,
    mostMissed: missed.rows.map((row) => ({
      question: row.text,
      attempts: num(row.attempts),
      missed: num(row.missed),
      missRatePct: pct(num(row.missed), num(row.attempts)),
    })),
    byCategory: byCat.rows.map((row) => ({
      category: row.category,
      answers: num(row.answers),
      accuracyPct: pct(num(row.correct), num(row.answers)),
    })),
    byDifficulty: byDiff.rows.map((row) => ({
      difficulty: row.difficulty,
      answers: num(row.answers),
      accuracyPct: pct(num(row.correct), num(row.answers)),
    })),
    recent: recent.rows.map((row) => ({
      type: row.type,
      gameId: row.game_id,
      at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    })),
    users: {
      unique: num(u.unique),
      returning: num(u.returning),
      newThisWeek: num(u.new_week),
      avgGamesPerPlayer: Math.round(num(u.avg_games) * 10) / 10,
      repeatRatePct: pct(num(u.returning), num(u.played)),
      top: topPlayers.rows.map((row) => ({
        nickname: row.nickname,
        games: num(row.games),
        best: num(row.best),
      })),
    },
  };
}
