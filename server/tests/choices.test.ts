import { describe, it, expect } from 'vitest';
import { shuffle, buildChoices, seededRng } from '../src/domain/choices';

describe('shuffle', () => {
  it('returns a new array and does not mutate the input', () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input, () => 0);
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('preserves every element (is a permutation)', () => {
    const input = ['a', 'b', 'c', 'd'];
    const out = shuffle(input, () => 0.5);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('is deterministic given a fixed rng', () => {
    const rng = () => 0; // always swaps with index 0
    const a = shuffle([1, 2, 3], rng);
    const b = shuffle([1, 2, 3], rng);
    expect(a).toEqual(b);
  });
});

describe('buildChoices', () => {
  it('includes the correct answer and all incorrect answers', () => {
    const choices = buildChoices('right', ['w1', 'w2', 'w3'], () => 0.5);
    expect([...choices].sort()).toEqual(['right', 'w1', 'w2', 'w3'].sort());
  });

  it('has exactly four choices for a standard question', () => {
    const choices = buildChoices('right', ['w1', 'w2', 'w3']);
    expect(choices).toHaveLength(4);
  });

  it('does not flag which choice is correct (plain strings only)', () => {
    const choices = buildChoices('right', ['w1', 'w2', 'w3']);
    expect(choices.every((c) => typeof c === 'string')).toBe(true);
  });

  it('orders choices identically for the same question seed (API-6)', () => {
    const a = buildChoices('right', ['w1', 'w2', 'w3'], seededRng('question-42'));
    const b = buildChoices('right', ['w1', 'w2', 'w3'], seededRng('question-42'));
    expect(a).toEqual(b);
  });

  it('orders choices differently for different seeds (still varied)', () => {
    // Two distinct seeds should not be forced to the same permutation.
    const orders = new Set(
      ['q1', 'q2', 'q3', 'q4', 'q5'].map((s) =>
        buildChoices('right', ['w1', 'w2', 'w3'], seededRng(s)).join('|'),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('seededRng', () => {
  it('produces values in [0, 1)', () => {
    const rng = seededRng('seed');
    for (let i = 0; i < 50; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is reproducible for the same seed and differs across seeds', () => {
    const first = [seededRng('x')(), seededRng('x')()];
    expect(first[0]).toBe(first[1]);
    expect(seededRng('x')()).not.toBe(seededRng('y')());
  });
});
