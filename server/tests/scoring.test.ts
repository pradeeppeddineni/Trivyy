import { describe, it, expect } from 'vitest';
import { scoreRound, decideMatch } from '../src/domain/scoring';

describe('scoreRound', () => {
  it('awards +1 per correct answer', () => {
    expect(scoreRound([{ correct: true }, { correct: true }, { correct: true }])).toBe(3);
  });

  it('awards 0 for wrong answers', () => {
    expect(scoreRound([{ correct: false }, { correct: false }])).toBe(0);
  });

  it('treats an unanswered (not correct) question as 0', () => {
    expect(scoreRound([{ correct: true }, { correct: false }, { correct: true }])).toBe(2);
  });

  it('scores an empty round as 0', () => {
    expect(scoreRound([])).toBe(0);
  });
});

describe('decideMatch', () => {
  it('declares player a the winner when ahead', () => {
    expect(decideMatch(5, 3)).toEqual({ outcome: 'win', winner: 'a' });
  });

  it('declares player b the winner when ahead', () => {
    expect(decideMatch(2, 8)).toEqual({ outcome: 'win', winner: 'b' });
  });

  it('declares a draw on equal scores', () => {
    expect(decideMatch(4, 4)).toEqual({ outcome: 'draw' });
  });
});
