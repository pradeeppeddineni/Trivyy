/**
 * Pure choice assembly (ARC-1): no I/O. Builds the shuffled multiple-choice list
 * served to the client. The correct answer is mixed in but NOT flagged — grading
 * stays server-side so the answer is never leaked to the client.
 */

/** Fisher-Yates shuffle returning a new array (immutable input). */
export function shuffle<T>(items: ReadonlyArray<T>, rng: () => number = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Correct + incorrect answers, shuffled, with no indication of which is right. */
export function buildChoices(
  correctAnswer: string,
  incorrectAnswers: ReadonlyArray<string>,
  rng: () => number = Math.random,
): string[] {
  return shuffle([correctAnswer, ...incorrectAnswers], rng);
}

/**
 * Deterministic PRNG (mulberry32) seeded from a string. Seeding the choice
 * shuffle by question id makes the order STABLE across every serve of that
 * question, so all players in a duel/group — and any re-fetch — see the
 * identical option order (API-6), while still being unpredictable per question.
 */
export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
