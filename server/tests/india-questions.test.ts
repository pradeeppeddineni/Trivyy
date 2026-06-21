import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Content guard for the curated India question bank (scripts/data/india-questions.json).
 * The seed plumbing is type-checked elsewhere; what code can't catch is a bad
 * entry — a duplicate, the wrong number of options, or a category the schema
 * does not know. These assertions fail loudly before such content is seeded.
 */
const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, '..', '..', 'scripts', 'data', 'india-questions.json');

interface IndiaQuestion {
  text: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  category: string;
  difficulty: string;
}

const questions = JSON.parse(readFileSync(dataPath, 'utf8')) as IndiaQuestion[];

// Mirrors the curated category slugs (server/src/seed/categories) plus '' for
// uncategorised, which the legacy NOT-NULL `category` column stores as empty.
const ALLOWED_CATEGORIES = new Set([
  '',
  'science',
  'geography',
  'movies',
  'music',
  'history',
  'tech',
]);
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

describe('India question bank', () => {
  it('has a healthy number of curated questions', () => {
    expect(questions.length).toBeGreaterThanOrEqual(100);
  });

  it('has no duplicate question texts', () => {
    const texts = questions.map((q) => q.text.trim().toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('every entry is well-formed (4 distinct options, valid category + difficulty)', () => {
    for (const q of questions) {
      expect(q.text.trim().length, q.text).toBeGreaterThan(0);
      expect(q.correctAnswer.trim().length, q.text).toBeGreaterThan(0);
      expect(q.incorrectAnswers, q.text).toHaveLength(3);
      for (const wrong of q.incorrectAnswers) {
        expect(wrong.trim().length, q.text).toBeGreaterThan(0);
      }
      const options = [q.correctAnswer, ...q.incorrectAnswers].map((o) => o.trim().toLowerCase());
      expect(new Set(options).size, `duplicate option in: ${q.text}`).toBe(4);
      expect(ALLOWED_CATEGORIES.has(q.category), `bad category in: ${q.text}`).toBe(true);
      expect(ALLOWED_DIFFICULTIES.has(q.difficulty), `bad difficulty in: ${q.text}`).toBe(true);
    }
  });

  it('covers all difficulty levels', () => {
    const levels = new Set(questions.map((q) => q.difficulty));
    expect(levels).toEqual(new Set(['easy', 'medium', 'hard']));
  });
});
