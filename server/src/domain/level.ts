/**
 * Pure level/XP computation from cumulative points (ARC-1). No I/O, no clock.
 *
 * Threshold formula: a player reaches level n when they have accumulated at
 * least T(n) = 50 * n * (n - 1) points.
 *   Level 1: T(1) = 0      (everyone starts at level 1)
 *   Level 2: T(2) = 100
 *   Level 3: T(3) = 300
 *   Level 4: T(4) = 600
 *   …
 *
 * The gap between consecutive levels grows by 100 each time, making the early
 * levels quick to reach and later ones progressively harder.
 */

/** Cumulative point threshold to reach level n (1-based). */
function threshold(n: number): number {
  return 50 * n * (n - 1);
}

export interface LevelInfo {
  /** Current level (1-based). */
  readonly level: number;
  /** Points earned inside the current level (0 ≤ into < span). */
  readonly into: number;
  /** Total points required to complete the current level and advance. */
  readonly span: number;
  /** Percentage progress toward the next level, 0–100 (integer). */
  readonly pct: number;
}

/**
 * Derive the level and XP-bar values from a raw points total. Pure — suitable
 * for unit testing without any database or Express dependency.
 *
 * @param points Non-negative integer cumulative score.
 */
export function levelForPoints(points: number): LevelInfo {
  const p = Math.max(0, Math.floor(points));

  // Walk upward until the next threshold exceeds our points.
  let level = 1;
  while (threshold(level + 1) <= p) {
    level += 1;
  }

  const floor = threshold(level);
  const ceiling = threshold(level + 1);
  const span = ceiling - floor;
  const into = p - floor;
  const pct = Math.min(100, Math.round((into / span) * 100));

  return { level, into, span, pct };
}
