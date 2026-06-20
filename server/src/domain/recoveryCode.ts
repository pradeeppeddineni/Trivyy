import { GAME_CODE_ALPHABET } from './gameCode';

/**
 * Pure recovery-code generation (ARC-1): no I/O. The code is shown to the user
 * exactly once at registration and stored only as an argon2 hash (SEC-3a). It is
 * the sole way to reset a password (no email), so it is longer and grouped for
 * readability: 4 groups of 4 from the unambiguous alphabet (no 0/O/1/I/L),
 * e.g. `K7M2-9PQR-4XYZ-8ABC`. ~16^... bits of entropy — fine for a friends app.
 */

export const RECOVERY_GROUPS = 4;
export const RECOVERY_GROUP_LEN = 4;

/** Generate a grouped recovery code. `rng` is injectable for deterministic tests. */
export function generateRecoveryCode(rng: () => number = Math.random): string {
  const groups: string[] = [];
  for (let g = 0; g < RECOVERY_GROUPS; g += 1) {
    let group = '';
    for (let i = 0; i < RECOVERY_GROUP_LEN; i += 1) {
      group += GAME_CODE_ALPHABET[Math.floor(rng() * GAME_CODE_ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join('-');
}

/**
 * Normalise a code the user typed back (uppercase, strip spaces; accept with or
 * without the dashes) so reset is forgiving of formatting before the hash check.
 */
export function normalizeRecoveryCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const groups: string[] = [];
  for (let i = 0; i < cleaned.length; i += RECOVERY_GROUP_LEN) {
    groups.push(cleaned.slice(i, i + RECOVERY_GROUP_LEN));
  }
  return groups.join('-');
}
