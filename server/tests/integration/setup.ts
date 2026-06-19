import { Pool } from 'pg';

/**
 * Shared integration-test database helpers. These tests require a real Postgres
 * (DATABASE_URL) with the migrations applied; they run in CI after
 * `npm run migrate`. Each test file seeds a small deterministic question bank so
 * a solo game can be created and graded without the live OpenTDB API.
 */
const connectionString = process.env.DATABASE_URL;

export const testPool = new Pool({ connectionString });

/** Insert ~12 deterministic questions across the six curated categories. */
export async function seedQuestions(): Promise<void> {
  // Categories are inserted by migration; map slugs to ids here.
  const cats = await testPool.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM categories`,
  );
  const idForSlug = new Map(cats.rows.map((row) => [row.slug, row.id]));

  const rows: Array<[string, string, string[], string, string]> = [
    ['Q-science-1: chemical symbol for water?', 'H2O', ['CO2', 'O2', 'HO'], 'science', 'easy'],
    [
      'Q-science-2: speed of light approx?',
      '300000 km/s',
      ['150000 km/s', '1000 km/s', '30 km/s'],
      'science',
      'medium',
    ],
    [
      'Q-geography-1: capital of France?',
      'Paris',
      ['Lyon', 'Nice', 'Marseille'],
      'geography',
      'easy',
    ],
    [
      'Q-geography-2: largest ocean?',
      'Pacific',
      ['Atlantic', 'Indian', 'Arctic'],
      'geography',
      'medium',
    ],
    [
      'Q-movies-1: who directed Jaws?',
      'Spielberg',
      ['Lucas', 'Scorsese', 'Cameron'],
      'movies',
      'hard',
    ],
    ['Q-movies-2: year Toy Story released?', '1995', ['1999', '2001', '1990'], 'movies', 'medium'],
    ['Q-music-1: how many strings on a guitar?', '6', ['4', '5', '7'], 'music', 'easy'],
    ['Q-music-2: Beethoven wrote how many symphonies?', '9', ['5', '7', '12'], 'music', 'hard'],
    [
      'Q-history-1: who was first US president?',
      'Washington',
      ['Lincoln', 'Adams', 'Jefferson'],
      'history',
      'easy',
    ],
    ['Q-history-2: year WW2 ended?', '1945', ['1939', '1918', '1950'], 'history', 'medium'],
    [
      'Q-tech-1: what does CPU stand for?',
      'Central Processing Unit',
      ['Computer Personal Unit', 'Central Power Unit', 'Core Processing Unit'],
      'tech',
      'easy',
    ],
    [
      'Q-tech-2: who co-founded Apple?',
      'Steve Jobs',
      ['Bill Gates', 'Larry Page', 'Elon Musk'],
      'tech',
      'medium',
    ],
  ];

  for (const [text, correct, wrong, slug, difficulty] of rows) {
    await testPool.query(
      `INSERT INTO questions (text, correct_answer, incorrect_answers, category, category_id, difficulty, source, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'test', 'active')`,
      [text, correct, wrong, slug, idForSlug.get(slug) ?? null, difficulty],
    );
  }
}

/** Remove all gameplay + question rows so each test file starts clean. */
export async function resetGameData(): Promise<void> {
  await testPool.query(
    `TRUNCATE answers, events, game_players, games, questions, players RESTART IDENTITY CASCADE`,
  );
}
