import { describe, it, expect } from 'vitest';
import { generateGameCode, GAME_CODE_ALPHABET, GAME_CODE_LENGTH } from '../src/domain/gameCode';

describe('generateGameCode', () => {
  it('produces a code of the fixed length', () => {
    expect(generateGameCode()).toHaveLength(GAME_CODE_LENGTH);
  });

  it('uses only the unambiguous alphabet (no 0 O 1 I L)', () => {
    // 200 codes is plenty to exercise every position with the real RNG.
    for (let i = 0; i < 200; i += 1) {
      const code = generateGameCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('is deterministic for a given rng (first and last char)', () => {
    // rng = 0 -> index 0 -> first letter of the alphabet.
    expect(generateGameCode(() => 0)).toBe(GAME_CODE_ALPHABET[0].repeat(GAME_CODE_LENGTH));
    // rng just under 1 -> last index -> last char of the alphabet.
    const last = GAME_CODE_ALPHABET[GAME_CODE_ALPHABET.length - 1];
    expect(generateGameCode(() => 0.999999)).toBe(last.repeat(GAME_CODE_LENGTH));
  });

  it('walks the alphabet when the rng advances', () => {
    const seq = [0, 1 / GAME_CODE_ALPHABET.length, 2 / GAME_CODE_ALPHABET.length, 0, 0];
    let i = 0;
    const code = generateGameCode(() => seq[i++]);
    expect(code).toBe(
      GAME_CODE_ALPHABET[0] +
        GAME_CODE_ALPHABET[1] +
        GAME_CODE_ALPHABET[2] +
        GAME_CODE_ALPHABET[0] +
        GAME_CODE_ALPHABET[0],
    );
  });
});
