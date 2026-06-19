import { describe, it, expect } from 'vitest';
import { shuffle, buildChoices } from '../src/domain/choices';

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
});
