import { describe, it, expect } from 'vitest';
import { computeAchievements } from '../src/domain/achievements';

/** Minimal stats that earn nothing. */
const ZERO = { games: 0, points: 0, answers: 0, correct: 0, accuracyPct: 0 };

describe('computeAchievements', () => {
  it('returns the full catalog (6 entries) for any input', () => {
    expect(computeAchievements(ZERO)).toHaveLength(6);
  });

  it('all achievements are locked at zero stats', () => {
    const result = computeAchievements(ZERO);
    expect(result.every((a) => !a.earned)).toBe(true);
  });

  it('first_game: earned after 1 game, locked before', () => {
    expect(
      computeAchievements({ ...ZERO, games: 0 }).find((a) => a.key === 'first_game')!.earned,
    ).toBe(false);
    expect(
      computeAchievements({ ...ZERO, games: 1 }).find((a) => a.key === 'first_game')!.earned,
    ).toBe(true);
    expect(
      computeAchievements({ ...ZERO, games: 5 }).find((a) => a.key === 'first_game')!.earned,
    ).toBe(true);
  });

  it('ten_games: earned at 10, locked at 9', () => {
    expect(
      computeAchievements({ ...ZERO, games: 9 }).find((a) => a.key === 'ten_games')!.earned,
    ).toBe(false);
    expect(
      computeAchievements({ ...ZERO, games: 10 }).find((a) => a.key === 'ten_games')!.earned,
    ).toBe(true);
  });

  it('centurion: earned at 100 correct, locked at 99', () => {
    expect(
      computeAchievements({ ...ZERO, correct: 99 }).find((a) => a.key === 'centurion')!.earned,
    ).toBe(false);
    expect(
      computeAchievements({ ...ZERO, correct: 100 }).find((a) => a.key === 'centurion')!.earned,
    ).toBe(true);
  });

  it('sharpshooter: requires both >=90% accuracy AND >=20 answers', () => {
    // High accuracy but too few answers
    expect(
      computeAchievements({ ...ZERO, accuracyPct: 95, answers: 19 }).find(
        (a) => a.key === 'sharpshooter',
      )!.earned,
    ).toBe(false);
    // Enough answers but low accuracy
    expect(
      computeAchievements({ ...ZERO, accuracyPct: 89, answers: 20 }).find(
        (a) => a.key === 'sharpshooter',
      )!.earned,
    ).toBe(false);
    // Exactly meets both thresholds
    expect(
      computeAchievements({ ...ZERO, accuracyPct: 90, answers: 20 }).find(
        (a) => a.key === 'sharpshooter',
      )!.earned,
    ).toBe(true);
    // Well over both thresholds
    expect(
      computeAchievements({ ...ZERO, accuracyPct: 100, answers: 50 }).find(
        (a) => a.key === 'sharpshooter',
      )!.earned,
    ).toBe(true);
  });

  it('high_scorer: earned at 1000 points, locked at 999', () => {
    expect(
      computeAchievements({ ...ZERO, points: 999 }).find((a) => a.key === 'high_scorer')!.earned,
    ).toBe(false);
    expect(
      computeAchievements({ ...ZERO, points: 1000 }).find((a) => a.key === 'high_scorer')!.earned,
    ).toBe(true);
  });

  it('marathoner: earned at 50 games, locked at 49', () => {
    expect(
      computeAchievements({ ...ZERO, games: 49 }).find((a) => a.key === 'marathoner')!.earned,
    ).toBe(false);
    expect(
      computeAchievements({ ...ZERO, games: 50 }).find((a) => a.key === 'marathoner')!.earned,
    ).toBe(true);
  });

  it('does not mutate the input', () => {
    const input = { ...ZERO, games: 5 };
    computeAchievements(input);
    expect(input).toEqual({ ...ZERO, games: 5 });
  });

  it('each achievement has required shape', () => {
    computeAchievements(ZERO).forEach((a) => {
      expect(typeof a.key).toBe('string');
      expect(typeof a.label).toBe('string');
      expect(typeof a.description).toBe('string');
      expect(typeof a.earned).toBe('boolean');
    });
  });
});
