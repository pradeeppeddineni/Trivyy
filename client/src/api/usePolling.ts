import { useEffect, useRef } from 'react';

export interface PollingOptions {
  /** Poll only while true — flip to false to stop (e.g. once a game completes). */
  readonly enabled: boolean;
  /** Cadence while the tab is visible (API-7 default ~3s). */
  readonly activeMs?: number;
  /** Re-check cadence while the tab is hidden — polling itself pauses. */
  readonly idleMs?: number;
}

/**
 * Lightweight REST polling for the lobby / waiting / leaderboard screens
 * (API-7). Calls `fn` immediately, then every `activeMs` while the tab is
 * visible; pauses while hidden and resumes on focus; stops entirely when
 * `enabled` is false. Keeps poll endpoints cheap by not hammering in the
 * background.
 */
export function usePolling(fn: () => void | Promise<void>, options: PollingOptions): void {
  const { enabled, activeMs = 3000, idleMs = 10000 } = options;
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let timer: number | undefined;
    let cancelled = false;

    const tick = async (): Promise<void> => {
      if (cancelled) {
        return;
      }
      // Paused while hidden; look again at the idle cadence.
      if (typeof document !== 'undefined' && document.hidden) {
        timer = window.setTimeout(() => void tick(), idleMs);
        return;
      }
      try {
        await fnRef.current();
      } catch {
        // The caller owns its error state; keep polling.
      }
      if (!cancelled) {
        timer = window.setTimeout(() => void tick(), activeMs);
      }
    };

    const onVisible = (): void => {
      if (!cancelled && !document.hidden) {
        window.clearTimeout(timer);
        void tick();
      }
    };

    void tick();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, activeMs, idleMs]);
}
