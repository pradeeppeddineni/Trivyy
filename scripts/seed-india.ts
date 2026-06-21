/**
 * Seed script — import the curated, India-themed question bank
 * (scripts/data/india-questions.json) into Postgres, tagged region='IN' and
 * source='authored' (spec §5.6, DB-7).
 *
 * Why this exists: OpenTDB and The Trivia API have no "about India" topic — their
 * `region` parameter only filters by *availability*, not subject. An earlier
 * import therefore tagged 150 generic world-trivia questions as region='IN',
 * so picking India returned random questions. This script replaces that content
 * with genuinely India-themed questions and removes the mislabeled rows.
 *
 * Cleanup of the mislabeled rows is safe: rows already answered by real players
 * are untagged to global (region=NULL) so their answer history is preserved
 * (FK + analytics), and only the unanswered mislabeled rows are deleted.
 *
 * Usage:  DATABASE_URL=... npm run seed:india
 * Re-runnable: existing questions are matched by text and skipped.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Pool } from 'pg';

type Difficulty = 'easy' | 'medium' | 'hard';

interface IndiaQuestion {
  readonly text: string;
  readonly correctAnswer: string;
  readonly incorrectAnswers: ReadonlyArray<string>;
  /** A curated category slug, or '' for uncategorised (legacy column is NOT NULL). */
  readonly category: string;
  readonly difficulty: Difficulty;
}

function loadQuestions(): ReadonlyArray<IndiaQuestion> {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, 'data', 'india-questions.json'), 'utf8');
  const parsed = JSON.parse(raw) as IndiaQuestion[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('india-questions.json is empty or not an array');
  }
  return parsed;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to seed.');
    process.exit(1);
  }

  const questions = loadQuestions();
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    // 1) Untag mislabeled rows that were already answered (preserve history).
    const untagged = await pool.query(
      `UPDATE questions SET region = NULL
        WHERE region = 'IN' AND source = 'trivia-api'
          AND id IN (SELECT DISTINCT question_id FROM answers)`,
    );
    // 2) Delete the remaining (unanswered) mislabeled rows.
    const deleted = await pool.query(
      `DELETE FROM questions
        WHERE region = 'IN' AND source = 'trivia-api'
          AND id NOT IN (SELECT DISTINCT question_id FROM answers)`,
    );
    console.log(
      `Cleanup: untagged ${untagged.rowCount ?? 0} answered + deleted ${deleted.rowCount ?? 0} mislabeled region='IN' rows.`,
    );

    // 3) Map curated slugs to category ids (uncategorised stays null).
    const cats = await pool.query<{ id: string; slug: string }>('SELECT id, slug FROM categories');
    const slugToId = new Map(cats.rows.map((r) => [r.slug, r.id]));

    let inserted = 0;
    let skipped = 0;
    for (const q of questions) {
      const existing = await pool.query('SELECT 1 FROM questions WHERE text = $1 LIMIT 1', [
        q.text,
      ]);
      if ((existing.rowCount ?? 0) > 0) {
        skipped += 1;
        continue;
      }
      const categoryId = q.category ? (slugToId.get(q.category) ?? null) : null;
      await pool.query(
        `INSERT INTO questions
           (text, correct_answer, incorrect_answers, category, category_id, difficulty, region, source, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'IN', 'authored', 'active')`,
        [q.text, q.correctAnswer, q.incorrectAnswers, q.category, categoryId, q.difficulty],
      );
      inserted += 1;
    }
    console.log(`Done. Seeded ${inserted} India questions (${skipped} already present).`);
  } catch (error) {
    console.error('India seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
