import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getStoredNickname, setStoredNickname } from './nickname';

describe('nickname storage', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('returns empty string when nothing is stored', () => {
    expect(getStoredNickname()).toBe('');
  });

  it('round-trips a stored nickname', () => {
    setStoredNickname('QuizWhiz');
    expect(getStoredNickname()).toBe('QuizWhiz');
  });

  it('returns empty string if reading throws (storage disabled)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getStoredNickname()).toBe('');
  });

  it('swallows write errors (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => setStoredNickname('x')).not.toThrow();
  });
});
