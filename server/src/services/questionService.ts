import { pool } from '../db/pool';

/**
 * Question selection (spec 4.1). Pure SQL data access only — no Express types
 * (ARC-2). The locked set returned here is stored on the game so every player
 * sees the same questions (API-6); grading data (the correct answer) never
 * leaves the service layer.
 */
export interface QuestionRow {
  readonly id: string;
  readonly text: string;
  readonly correct_answer: string;
  readonly incorrect_answers: ReadonlyArray<string>;
  readonly category_id: string | null;
  readonly category_slug: string | null;
  readonly category_label: string | null;
  readonly category_icon: string | null;
  readonly difficulty: string;
}

export type DifficultyFilter = 'any' | 'easy' | 'medium' | 'hard';

export interface PickQuestionsOptions {
  readonly playerId: string;
  readonly count: number;
  /** Curated category slug, or undefined for "Surprise me" (no filter). */
  readonly categorySlug?: string;
  /** 'any' (or undefined) means no difficulty filter. */
  readonly difficulty?: DifficultyFilter;
}

/**
 * Pick `count` active questions, optionally filtered by category slug and
 * difficulty, preferring questions the player has not already answered, in
 * random order. When the unseen pool is too small, already-seen questions
 * backfill so a game always has its full set where the bank allows.
 */
export async function pickQuestions(
  options: PickQuestionsOptions,
): Promise<ReadonlyArray<QuestionRow>> {
  const { playerId, count, categorySlug, difficulty } = options;

  const conditions: string[] = ["q.status = 'active'"];
  const params: unknown[] = [playerId];

  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (difficulty && difficulty !== 'any') {
    params.push(difficulty);
    conditions.push(`q.difficulty = $${params.length}`);
  }
  params.push(count);
  const limitParam = `$${params.length}`;

  // Order unseen questions first (seen DESC = NULLs first), then randomly within
  // each group, so the player gets fresh questions where possible (spec 4.1).
  const result = await pool.query<QuestionRow>(
    `SELECT q.id, q.text, q.correct_answer, q.incorrect_answers,
            q.category_id, q.difficulty,
            c.slug AS category_slug, c.label AS category_label, c.icon AS category_icon
       FROM questions q
       LEFT JOIN categories c ON c.id = q.category_id
       LEFT JOIN LATERAL (
         SELECT 1 AS seen FROM answers a
          WHERE a.question_id = q.id AND a.player_id = $1
          LIMIT 1
       ) seen ON true
      WHERE ${conditions.join(' AND ')}
      ORDER BY seen.seen NULLS FIRST, random()
      LIMIT ${limitParam}`,
    params,
  );
  return result.rows;
}

/** Resolve a curated category slug to its id, or null when it does not exist. */
export async function categoryIdForSlug(slug: string): Promise<string | null> {
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM categories WHERE slug = $1 AND status = 'active' LIMIT 1`,
    [slug],
  );
  return result.rows[0]?.id ?? null;
}
