/**
 * Pure game-code generation (ARC-1): no I/O, no clock. A game code is the
 * short, human-shareable handle for duel and group games (spec §4). Collision
 * handling (uniqueness) is the service layer's job — this only produces a
 * well-formed candidate.
 *
 * Format (resolved decision, implementation-plan.md): 5 uppercase chars from an
 * unambiguous alphabet that omits 0/O, 1/I/L so a code is easy to read aloud
 * and type from a phone.
 */

/** Unambiguous alphabet: A–Z and 2–9, minus the easily-confused 0 O 1 I L. */
export const GAME_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const GAME_CODE_LENGTH = 5;

/**
 * Generate one game-code candidate. `rng` is injectable so tests are
 * deterministic; it defaults to `Math.random`.
 */
export function generateGameCode(rng: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < GAME_CODE_LENGTH; i += 1) {
    const index = Math.floor(rng() * GAME_CODE_ALPHABET.length);
    code += GAME_CODE_ALPHABET[index];
  }
  return code;
}
