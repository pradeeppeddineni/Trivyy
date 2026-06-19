/**
 * Pure scoring and match-decision logic (ARC-1): no I/O, no database, no clock.
 * This is the most-tested module in the app because it is the rules of the game.
 * Scoring per spec section 4.3: correct = +1, wrong or unanswered = 0,
 * higher total wins, equal totals are a draw.
 */

export interface AnswerOutcome {
  readonly correct: boolean;
}

/** Total score for one player's round. */
export function scoreRound(answers: ReadonlyArray<AnswerOutcome>): number {
  return answers.reduce((total, answer) => total + (answer.correct ? 1 : 0), 0);
}

export type MatchResult =
  | { readonly outcome: 'win'; readonly winner: 'a' | 'b' }
  | { readonly outcome: 'draw' };

/** Decide a duel from two final scores. */
export function decideMatch(scoreA: number, scoreB: number): MatchResult {
  if (scoreA === scoreB) {
    return { outcome: 'draw' };
  }
  return { outcome: 'win', winner: scoreA > scoreB ? 'a' : 'b' };
}
