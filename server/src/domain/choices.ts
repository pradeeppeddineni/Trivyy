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
