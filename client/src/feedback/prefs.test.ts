import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getFeedbackPrefs, setFeedbackPrefs, useFeedbackPrefs } from './prefs';

const STORAGE_KEY = 'trivyy.feedback';

describe('getFeedbackPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns both-true defaults when nothing is stored', () => {
    const prefs = getFeedbackPrefs();
    expect(prefs).toEqual({ sound: true, haptics: true });
  });

  it('returns stored values when valid JSON is present', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound: false, haptics: true }));
    expect(getFeedbackPrefs()).toEqual({ sound: false, haptics: true });
  });

  it('returns defaults when stored JSON is malformed', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    expect(getFeedbackPrefs()).toEqual({ sound: true, haptics: true });
  });

  it('returns defaults when stored JSON has wrong shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound: 'yes', haptics: 1 }));
    expect(getFeedbackPrefs()).toEqual({ sound: true, haptics: true });
  });

  it('returns defaults when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('storage error');
    });
    expect(getFeedbackPrefs()).toEqual({ sound: true, haptics: true });
  });
});

describe('setFeedbackPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists prefs to localStorage', () => {
    setFeedbackPrefs({ sound: false, haptics: false });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ sound: false, haptics: false }),
    );
  });

  it('round-trips correctly', () => {
    setFeedbackPrefs({ sound: false, haptics: true });
    expect(getFeedbackPrefs()).toEqual({ sound: false, haptics: true });
  });

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('storage full');
    });
    expect(() => setFeedbackPrefs({ sound: true, haptics: true })).not.toThrow();
  });
});

describe('useFeedbackPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    const { result } = renderHook(() => useFeedbackPrefs());
    expect(result.current[0]).toEqual({ sound: true, haptics: true });
  });

  it('setter updates state and persists', () => {
    const { result } = renderHook(() => useFeedbackPrefs());
    act(() => {
      result.current[1]({ sound: false, haptics: false });
    });
    expect(result.current[0]).toEqual({ sound: false, haptics: false });
    expect(getFeedbackPrefs()).toEqual({ sound: false, haptics: false });
  });
});
