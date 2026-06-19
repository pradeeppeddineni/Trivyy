import { useEffect, useState } from 'react';

/**
 * Every screen defines explicit loading, empty, error, and success states
 * (ARC-4). This placeholder home screen demonstrates the four-state contract;
 * the real game screens and Claude Design components replace it during the
 * feature build.
 */
type ScreenState = 'loading' | 'empty' | 'error' | 'success';

export function Home() {
  const [state, setState] = useState<ScreenState>('loading');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    // Data fetching wires in during the feature build; for now we resolve to
    // the empty state so the skeleton renders without a backend.
    setState('empty');
  }, []);

  if (state === 'loading') {
    return <p>Loading…</p>;
  }

  if (state === 'error') {
    return <p role="alert">Something went wrong. Please try again.</p>;
  }

  return (
    <main style={{ padding: 'var(--space-4)' }}>
      <h1>Trivyy</h1>
      {state === 'empty' && <p>No games yet. Start a solo game to begin.</p>}
      {state === 'success' && <p>Welcome, {nickname}!</p>}
      <button
        type="button"
        onClick={() => {
          setNickname('player');
          setState('success');
        }}
      >
        Start solo game
      </button>
    </main>
  );
}
