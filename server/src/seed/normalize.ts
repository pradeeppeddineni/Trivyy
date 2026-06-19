import { mapOpenTdbCategory, type CategorySlug } from './categories';

/** A single result as returned by the OpenTDB API (encoded text). */
export interface OpenTdbResult {
  readonly question: string;
  readonly correct_answer: string;
  readonly incorrect_answers: string[];
  readonly category: string;
  readonly difficulty: string;
}

/** A question normalized into our schema shape (spec 5.3). */
export interface NormalizedQuestion {
  readonly text: string;
  readonly correctAnswer: string;
  readonly incorrectAnswers: string[];
  readonly category: string; // raw OpenTDB category, kept for re-mapping
  readonly categorySlug: CategorySlug | null; // curated mapping, or null = "any" only
  readonly difficulty: string;
  readonly source: 'opentdb';
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
  return input
    .replace(/&[a-z]+;|&#\d+;/gi, (match) => ENTITIES[match] ?? match)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

/** Normalize one OpenTDB result into our schema, decoding + mapping its category. */
export function normalize(result: OpenTdbResult): NormalizedQuestion {
  return {
    text: decodeEntities(result.question),
    correctAnswer: decodeEntities(result.correct_answer),
    incorrectAnswers: result.incorrect_answers.map(decodeEntities),
    category: decodeEntities(result.category),
    categorySlug: mapOpenTdbCategory(result.category),
    difficulty: result.difficulty,
    source: 'opentdb',
  };
}

/** Drop duplicates on question text, case-insensitively (spec 5.3, step 4). */
export function deduplicate(questions: readonly NormalizedQuestion[]): NormalizedQuestion[] {
  const seen = new Set<string>();
  const unique: NormalizedQuestion[] = [];
  for (const q of questions) {
    const key = q.text.trim().toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(q);
  }
  return unique;
}
