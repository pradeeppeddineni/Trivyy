/**
 * Seed script — import questions from the Open Trivia Database into Postgres
 * (spec section 5.3). Re-runnable to top up the pool.
 *
 * SKELETON: this fetches, decodes, normalizes, and deduplicates, then reports
 * the batch. Wiring the INSERT into the `questions` table lands in the
 * schema/data course block (it uses src/db/pool.ts). Run with: npm run seed
 *
 * OpenTDB content is licensed CC BY-SA 4.0 — keep the `source` field and the
 * in-app attribution (DB-7).
 */

interface OpenTdbResult {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  category: string;
  difficulty: string;
}

interface NormalizedQuestion {
  text: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  category: string;
  difficulty: string;
  source: 'opentdb';
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&eacute;': 'é',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
};

/** Decode the HTML entities OpenTDB returns (spec 5.3, step 2). */
export function decodeEntities(input: string): string {
  return input.replace(/&[a-z]+;|&#\d+;/gi, (match) => ENTITIES[match] ?? match);
}

function normalize(result: OpenTdbResult): NormalizedQuestion {
  return {
    text: decodeEntities(result.question),
    correctAnswer: decodeEntities(result.correct_answer),
    incorrectAnswers: result.incorrect_answers.map(decodeEntities),
    category: decodeEntities(result.category),
    difficulty: result.difficulty,
    source: 'opentdb',
  };
}

/** Drop duplicates on question text (spec 5.3, step 4). */
function deduplicate(questions: NormalizedQuestion[]): NormalizedQuestion[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const key = q.text.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchBatch(amount: number): Promise<OpenTdbResult[]> {
  const res = await fetch(`https://opentdb.com/api.php?amount=${amount}`);
  if (!res.ok) {
    throw new Error(`OpenTDB request failed: ${res.status}`);
  }
  const data = (await res.json()) as { results: OpenTdbResult[] };
  return data.results;
}

async function main(): Promise<void> {
  const batch = await fetchBatch(50);
  const questions = deduplicate(batch.map(normalize));
  console.log(`Fetched ${batch.length}, ${questions.length} unique after dedupe.`);
  console.log('TODO: insert into the questions table via src/db/pool.ts.');
}

// Only run when invoked directly, so the pure helpers above stay importable.
const invokedDirectly = process.argv[1]?.includes('seed-questions');
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
