import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { ScoreStat } from '../components/ScoreStat';
import { getMyStats, type ProfileStats } from '../api/client';

const SECTION: CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.5px',
  margin: '22px 0 10px',
};

const CARD: CSSProperties = {
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--card)',
  padding: '12px 14px',
};

function goHome(): void {
  window.location.href = '/';
}

const MODE_LABEL: Record<string, string> = {
  solo: 'Solo',
  duel: 'Duel',
  together: 'Group',
};

/**
 * "My stats" — the current player's own play history (spec v3 §13), a
 * player-scoped view of the admin analytics: games, points, accuracy, accuracy
 * by category, and recent games. Works for guests and registered players.
 */
export function ProfileFlow(): JSX.Element {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    getMyStats()
      .then((s) => {
        if (!active) return;
        if (!s) {
          setState('none');
          return;
        }
        setStats(s);
        setState('ready');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, []);

  if (state === 'loading') {
    return (
      <AppFrame>
        <StatusScreen title="Loading your stats…" />
      </AppFrame>
    );
  }
  if (state === 'none') {
    return (
      <AppFrame>
        <PlayerHeader onLogoClick={goHome} />
        <StatusScreen
          title="No stats yet"
          message="Play a game and your stats will show up here."
          actionLabel="Play"
          onAction={goHome}
        />
      </AppFrame>
    );
  }
  if (state === 'error' || !stats) {
    return (
      <AppFrame>
        <StatusScreen
          title="Could not load your stats"
          tone="error"
          actionLabel="Back"
          onAction={goHome}
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <PlayerHeader onLogoClick={goHome} />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 20px 28px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '26px',
              margin: '8px 0',
              color: 'var(--ink)',
            }}
          >
            My stats
          </h1>
          <button
            type="button"
            onClick={goHome}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: 'var(--accent-strong)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ← Back
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          <ScoreStat label="Games played" value={stats.games} icon={<span aria-hidden>🎮</span>} />
          <ScoreStat label="Points" value={stats.points} icon={<span aria-hidden>⭐</span>} />
          <ScoreStat label="Answers" value={stats.answers} icon={<span aria-hidden>✍️</span>} />
          <ScoreStat
            label="Accuracy"
            value={`${stats.accuracyPct}%`}
            icon={<span aria-hidden>🎯</span>}
          />
        </div>

        <p style={SECTION}>ACCURACY BY CATEGORY</p>
        {stats.byCategory.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No answers yet.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.byCategory.map((c) => (
              <div
                key={c.category}
                style={{
                  ...CARD,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  {c.category}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)' }}>
                  {c.accuracyPct}% · {c.answers}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={SECTION}>RECENT GAMES</p>
        {stats.recent.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Nothing yet.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recent.map((r, i) => (
              <div
                key={i}
                style={{
                  ...CARD,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  {MODE_LABEL[r.mode] ?? r.mode}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                  {r.score}
                  <span style={{ fontSize: '12px', color: 'var(--score-total)' }}>/{r.total}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppFrame>
  );
}
