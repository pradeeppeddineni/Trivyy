import { describe, it, expect } from 'vitest';
import { generateRecoveryCode, normalizeRecoveryCode } from '../src/domain/recoveryCode';

describe('generateRecoveryCode', () => {
  it('produces 4 groups of 4 from the unambiguous alphabet', () => {
    for (let i = 0; i < 100; i += 1) {
      const code = generateRecoveryCode();
      expect(code).toMatch(
        /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}(-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}){3}$/,
      );
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('is deterministic for a given rng', () => {
    expect(generateRecoveryCode(() => 0)).toBe(generateRecoveryCode(() => 0));
    expect(generateRecoveryCode(() => 0)).toBe('AAAA-AAAA-AAAA-AAAA');
  });
});

describe('normalizeRecoveryCode', () => {
  it('uppercases, strips junk, and re-groups so reset is formatting-tolerant', () => {
    expect(normalizeRecoveryCode('k7m2-9pqr-4xyz-8abc')).toBe('K7M2-9PQR-4XYZ-8ABC');
    expect(normalizeRecoveryCode('k7m29pqr4xyz8abc')).toBe('K7M2-9PQR-4XYZ-8ABC');
    expect(normalizeRecoveryCode('  K7M2 9PQR 4XYZ 8ABC  ')).toBe('K7M2-9PQR-4XYZ-8ABC');
  });

  it('round-trips a generated code', () => {
    const code = generateRecoveryCode(() => 0.5);
    expect(normalizeRecoveryCode(code)).toBe(code);
  });
});
