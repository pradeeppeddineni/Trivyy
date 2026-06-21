import { useState, useEffect } from 'react';

const STORAGE_KEY = 'trivyy.feedback';

export interface FeedbackPrefs {
  readonly sound: boolean;
  readonly haptics: boolean;
}

const DEFAULT_PREFS: FeedbackPrefs = { sound: true, haptics: true };

export function getFeedbackPrefs(): FeedbackPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.sound === 'boolean' &&
      typeof parsed.haptics === 'boolean'
    ) {
      return { sound: parsed.sound, haptics: parsed.haptics };
    }
    return DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function setFeedbackPrefs(p: FeedbackPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // storage unavailable; silently ignore
  }
}

export function useFeedbackPrefs(): [FeedbackPrefs, (p: FeedbackPrefs) => void] {
  const [prefs, setPrefsState] = useState<FeedbackPrefs>(getFeedbackPrefs);

  useEffect(() => {
    setPrefsState(getFeedbackPrefs());
  }, []);

  function setPrefs(p: FeedbackPrefs): void {
    setFeedbackPrefs(p);
    setPrefsState(p);
  }

  return [prefs, setPrefs];
}
