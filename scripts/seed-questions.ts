/**
 * Seed script — import questions from the Open Trivia Database into Postgres
 * (spec 5.3). Re-runnable to top up the pool.
 *
 * Usage:  npm run seed            (needs DATABASE_URL in the environment)
 * Tune:   SEED_TARGET=1000 npm run seed   (default 300)
 *
 * Pure normalization/category-mapping logic lives in server/src/seed (unit
 * tested); this script only does the network + database I/O. OpenTDB content is
 * CC BY-SA 4.0 — the `source` column records provenance (DB-7).
 */
import { Pool } from 'pg';
import {
  deduplicate,
  normalize,
  type NormalizedQuestion,
  type OpenTdbResult,
} from '../server/src/seed/normalize';

const TARGET = Number(process.env.SEED_TARGET ?? 300);
const BATCH = 50; // OpenTDB max questions per request
const RATE_LIMIT_MS = 5200; // OpenTDB throttles to ~1 request / 5s per IP

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function requestToken(): Promise<string> {
  const res = await fetch('https://opentdb.com/api_token.php?command=request');
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function fetchBatch(token: string): Promise<OpenTdbResult[]> {
  const res = await fetch(`https://opentdb.com/api.php?amount=${BATCH}&token=${token}`);
  if (!res.ok) {
    throw new Error(`OpenTDB request failed: ${res.status}`);
  }
  const data = (await res.json()) as { response_code: number; results?: OpenTdbResult[] };
  // response_code 4 = token exhausted (every question seen); signal the caller to stop.
  if (data.response_code === 4) {
    return [];
  }
  return data.results ?? [];
}

async function loadCategoryIds(pool: Pool): Promise<Map<string, string>> {
  const { rows } = await pool.query<{ id: string; slug: string }>(
    'SELECT id, slug FROM categories',
  );
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function insertQuestion(
  pool: Pool,
  q: NormalizedQuestion,
  categoryId: string | null,
): Promise<boolean> {
  const existing = await pool.query('SELECT 1 FROM questions WHERE text = $1 LIMIT 1', [q.text]);
  if ((existing.rowCount ?? 0) > 0) {
    return false; // dedup against what's already in the DB
  }
  await pool.query(
    `INSERT INTO questions
       (text, correct_answer, incorrect_answers, category, category_id, difficulty, source, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
    [q.text, q.correctAnswer, q.incorrectAnswers, q.category, categoryId, q.difficulty, q.source],
  );
  return true;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required to seed.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const slugToId = await loadCategoryIds(pool);
    if (slugToId.size === 0) {
      console.error('No categories found — run `npm run migrate` first.');
      return;
    }

    const token = await requestToken();
    await sleep(RATE_LIMIT_MS);

    let inserted = 0;
    let emptyRounds = 0;
    while (inserted < TARGET && emptyRounds < 2) {
      const batch = await fetchBatch(token);
      if (batch.length === 0) {
        emptyRounds += 1;
        await sleep(RATE_LIMIT_MS);
        continue;
      }
      emptyRounds = 0;

      for (const q of deduplicate(batch.map(normalize))) {
        if (inserted >= TARGET) {
          break;
        }
        const categoryId = q.categorySlug ? (slugToId.get(q.categorySlug) ?? null) : null;
        if (await insertQuestion(pool, q, categoryId)) {
          inserted += 1;
        }
      }
      console.log(`Inserted ${inserted}/${TARGET}…`);
      await sleep(RATE_LIMIT_MS);
    }
    console.log(`Done. Seeded ${inserted} questions.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
