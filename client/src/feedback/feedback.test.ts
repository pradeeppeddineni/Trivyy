import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { signal, vibrate, playTone } from './feedback';

describe('signal', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no AudioContext — this is fine; signal must not throw
    vi.stubGlobal('AudioContext', undefined);
    // Stub navigator.vibrate
    vi.stubGlobal('navigator', { vibrate: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when AudioContext is unavailable (jsdom)', () => {
    expect(() => signal('correct')).not.toThrow();
    expect(() => signal('wrong')).not.toThrow();
  });

  it('calls navigator.vibrate when haptics pref is on (default)', () => {
    signal('correct');
    expect(navigator.vibrate).toHaveBeenCalledWith([80]);
  });

  it('calls navigator.vibrate with double pattern for wrong', () => {
    signal('wrong');
    expect(navigator.vibrate).toHaveBeenCalledWith([80, 60, 80]);
  });

  it('does not call navigator.vibrate when haptics pref is off', () => {
    localStorage.setItem('trivyy.feedback', JSON.stringify({ sound: true, haptics: false }));
    signal('correct');
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('does not throw when navigator.vibrate throws', () => {
    (navigator.vibrate as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('vibrate failed');
    });
    expect(() => signal('correct')).not.toThrow();
  });
});

describe('vibrate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when navigator.vibrate is absent', () => {
    vi.stubGlobal('navigator', {});
    expect(() => vibrate('correct')).not.toThrow();
    expect(() => vibrate('wrong')).not.toThrow();
  });
});

describe('playTone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playTone('correct')).not.toThrow();
    expect(() => playTone('wrong')).not.toThrow();
  });
});
