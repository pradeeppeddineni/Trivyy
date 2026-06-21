/**
 * Seed script — import region-appropriate questions from The Trivia API
 * (the-trivia-api.com) into Postgres, tagged with an ISO-3166 region (spec
 * §5.6). The API's `region` param filters out questions unsuitable for that
 * region; combined with admin-authored content it gives players a regional
 * pool. Re-runnable; dedupes on question text.
 *
 * Usage:  REGION=IN SEED_TARGET=200 npm run seed:region   (needs DATABASE_URL)
 *
 * Category mapping reuses the keyword mapper (server/src/seed/categories), so
 * The Trivia API's category names land in our curated set where they fit. The
 * `source` column records provenance (DB-7); content is CC BY-SA 4.0.
 */
import { Pool } from 'pg';
import { mapOpenTdbCategory } from '../server/src/seed/categories';

const REGION = (process.env.REGION ?? 'IN').toUpperCase();
const TARGET = Number(process.env.SEED_TARGET ?? 200);
const BATCH = 50; // The Trivia API max per request
const RATE_LIMIT_MS = 1500;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface TriviaApiQuestion {
  readonly question: { readonly text: string };
  readonly correctAnswer: string;
  readonly incorrectAnswers: string[];
  readonly category: string;
  readonly difficulty: string;
}

async function fetchBatch(): Promise<TriviaApiQuestion[]> {
  const url = `https://the-trivia-api.com/v2/questions?limit=${BATCH}&region=${REGION}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`The Trivia API request failed: ${res.status}`);
  }
  return (await res.json()) as TriviaApiQuestion[];
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to seed.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const cats = await pool.query<{ id: string; slug: string }>('SELECT id, slug FROM categories');
    const slugToId = new Map(cats.rows.map((r) => [r.slug, r.id]));

    let inserted = 0;
    let emptyRounds = 0;
    while (inserted < TARGET && emptyRounds < 2) {
      const batch = await fetchBatch();
      if (batch.length === 0) {
        emptyRounds += 1;
        await sleep(RATE_LIMIT_MS);
        continue;
      }
      emptyRounds = 0;

      for (const q of batch) {
        if (inserted >= TARGET) break;
        const text = q.question.text;
        const existing = await pool.query('SELECT 1 FROM questions WHERE text = $1 LIMIT 1', [
          text,
        ]);
        if ((existing.rowCount ?? 0) > 0) continue;

        const slug = mapOpenTdbCategory(q.category);
        const categoryId = slug ? (slugToId.get(slug) ?? null) : null;
        const difficulty = ['easy', 'medium', 'hard'].includes(q.difficulty)
          ? q.difficulty
          : 'medium';
        await pool.query(
          `INSERT INTO questions
             (text, correct_answer, incorrect_answers, category, category_id, difficulty, region, source, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'trivia-api', 'active')`,
          [text, q.correctAnswer, q.incorrectAnswers, slug ?? '', categoryId, difficulty, REGION],
        );
        inserted += 1;
      }
      console.log(`Inserted ${inserted}/${TARGET} (${REGION})…`);
      await sleep(RATE_LIMIT_MS);
    }
    console.log(`Done. Seeded ${inserted} ${REGION} questions.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
