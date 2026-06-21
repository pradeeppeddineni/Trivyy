import { describe, it, expect } from 'vitest';
import { levelForPoints } from '../src/domain/level';

/**
 * Threshold recap: T(n) = 50 * n * (n-1)
 *   T(1)=0, T(2)=100, T(3)=300, T(4)=600, T(5)=1000, T(6)=1500
 */

describe('levelForPoints', () => {
  it('returns level 1 at 0 points', () => {
    const result = levelForPoints(0);
    expect(result.level).toBe(1);
    expect(result.into).toBe(0);
    expect(result.span).toBe(100); // T(2)-T(1)
    expect(result.pct).toBe(0);
  });

  it('returns level 1 at 50 points (halfway through level 1)', () => {
    const result = levelForPoints(50);
    expect(result.level).toBe(1);
    expect(result.into).toBe(50);
    expect(result.span).toBe(100);
    expect(result.pct).toBe(50);
  });

  it('returns level 1 at 99 points (one below level 2 threshold)', () => {
    const result = levelForPoints(99);
    expect(result.level).toBe(1);
    expect(result.pct).toBe(99);
  });

  it('returns level 2 at exactly 100 points (T(2))', () => {
    const result = levelForPoints(100);
    expect(result.level).toBe(2);
    expect(result.into).toBe(0);
    expect(result.span).toBe(200); // T(3)-T(2) = 300-100
    expect(result.pct).toBe(0);
  });

  it('returns level 2 at 200 points (halfway through level 2)', () => {
    const result = levelForPoints(200);
    expect(result.level).toBe(2);
    expect(result.into).toBe(100);
    expect(result.span).toBe(200);
    expect(result.pct).toBe(50);
  });

  it('returns level 3 at exactly 300 points (T(3))', () => {
    const result = levelForPoints(300);
    expect(result.level).toBe(3);
    expect(result.into).toBe(0);
    expect(result.span).toBe(300); // T(4)-T(3) = 600-300
    expect(result.pct).toBe(0);
  });

  it('returns level 4 at exactly 600 points (T(4))', () => {
    const result = levelForPoints(600);
    expect(result.level).toBe(4);
    expect(result.into).toBe(0);
    expect(result.span).toBe(400); // T(5)-T(4) = 1000-600
  });

  it('returns level 5 at exactly 1000 points (T(5))', () => {
    const result = levelForPoints(1000);
    expect(result.level).toBe(5);
    expect(result.into).toBe(0);
    expect(result.span).toBe(500); // T(6)-T(5) = 1500-1000
  });

  it('pct is always in range [0, 100]', () => {
    for (const pts of [0, 1, 50, 99, 100, 299, 300, 599, 999, 5000]) {
      const { pct } = levelForPoints(pts);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('handles negative points gracefully by treating them as 0', () => {
    const result = levelForPoints(-10);
    expect(result.level).toBe(1);
    expect(result.into).toBe(0);
    expect(result.pct).toBe(0);
  });

  it('handles very large point totals without error', () => {
    const result = levelForPoints(1_000_000);
    expect(result.level).toBeGreaterThan(100);
    expect(result.pct).toBeGreaterThanOrEqual(0);
    expect(result.pct).toBeLessThanOrEqual(100);
  });
});
