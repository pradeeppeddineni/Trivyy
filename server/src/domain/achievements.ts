/**
 * Pure achievement computation (ARC-1). No I/O, no database, no Express types.
 * The catalog is fixed at compile time; earned status is derived from the
 * player's stats snapshot on each read (API-8, no write-path change).
 */

export interface AchievementInput {
  readonly games: number;
  readonly points: number;
  readonly answers: number;
  readonly correct: number;
  readonly accuracyPct: number;
}

export interface Achievement {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly earned: boolean;
}

interface AchievementDef {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly test: (input: AchievementInput) => boolean;
}

const CATALOG: ReadonlyArray<AchievementDef> = [
  {
    key: 'first_game',
    label: 'First Game',
    description: 'Complete your first trivia game.',
    test: ({ games }) => games >= 1,
  },
  {
    key: 'ten_games',
    label: 'Dedicated Player',
    description: 'Complete 10 trivia games.',
    test: ({ games }) => games >= 10,
  },
  {
    key: 'centurion',
    label: 'Centurion',
    description: 'Answer 100 questions correctly.',
    test: ({ correct }) => correct >= 100,
  },
  {
    key: 'sharpshooter',
    label: 'Sharpshooter',
    description: 'Reach 90% accuracy across at least 20 answers.',
    test: ({ accuracyPct, answers }) => accuracyPct >= 90 && answers >= 20,
  },
  {
    key: 'high_scorer',
    label: 'High Scorer',
    description: 'Accumulate 1,000 points.',
    test: ({ points }) => points >= 1000,
  },
  {
    key: 'marathoner',
    label: 'Marathoner',
    description: 'Complete 50 trivia games.',
    test: ({ games }) => games >= 50,
  },
];

/**
 * Compute the full achievement catalog with earned/locked flags for one player.
 * Returns a new array every call — no shared mutable state.
 */
export function computeAchievements(input: AchievementInput): ReadonlyArray<Achievement> {
  return CATALOG.map(({ key, label, description, test }) => ({
    key,
    label,
    description,
    earned: test(input),
  }));
}
