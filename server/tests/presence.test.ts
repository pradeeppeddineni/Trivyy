import { describe, it, expect } from 'vitest';
import { isOnline } from '../src/services/presenceService';

/**
 * Unit tests for the pure `isOnline` helper. No DB needed.
 * Online window: 2 minutes (120 000 ms).
 */
describe('isOnline', () => {
  const NOW = new Date('2026-01-01T12:00:00.000Z').getTime();

  it('returns false for null', () => {
    expect(isOnline(null, NOW)).toBe(false);
  });

  it('returns true when last_seen_at is exactly now', () => {
    expect(isOnline(new Date(NOW), NOW)).toBe(true);
  });

  it('returns true just inside the 2-minute window (119 999 ms ago)', () => {
    const lastSeen = new Date(NOW - 119_999);
    expect(isOnline(lastSeen, NOW)).toBe(true);
  });

  it('returns true at exactly 2 minutes minus 1 ms', () => {
    const lastSeen = new Date(NOW - (2 * 60 * 1000 - 1));
    expect(isOnline(lastSeen, NOW)).toBe(true);
  });

  it('returns false at exactly 2 minutes (120 000 ms ago — not strictly less than)', () => {
    const lastSeen = new Date(NOW - 2 * 60 * 1000);
    expect(isOnline(lastSeen, NOW)).toBe(false);
  });

  it('returns false just outside the window (120 001 ms ago)', () => {
    const lastSeen = new Date(NOW - 120_001);
    expect(isOnline(lastSeen, NOW)).toBe(false);
  });

  it('returns false for a last_seen_at far in the past', () => {
    const lastSeen = new Date(NOW - 60 * 60 * 1000); // 1 hour ago
    expect(isOnline(lastSeen, NOW)).toBe(false);
  });

  it('accepts a string timestamp (ISO-8601)', () => {
    const justInside = new Date(NOW - 1000).toISOString();
    expect(isOnline(justInside, NOW)).toBe(true);

    const justOutside = new Date(NOW - 121_000).toISOString();
    expect(isOnline(justOutside, NOW)).toBe(false);
  });

  it('uses Date.now() when nowMs is omitted (smoke test)', () => {
    // A timestamp 1 second ago should be online right now.
    const recentDate = new Date(Date.now() - 1000);
    expect(isOnline(recentDate)).toBe(true);

    // A timestamp 5 minutes ago should be offline right now.
    const staleDate = new Date(Date.now() - 5 * 60 * 1000);
    expect(isOnline(staleDate)).toBe(false);
  });
});
