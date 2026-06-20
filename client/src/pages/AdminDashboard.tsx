import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../components/Button';
import { ScoreStat } from '../components/ScoreStat';
import { StatusScreen } from '../components/StatusScreen';
import { getAdminStats, type AdminStats } from '../api/client';

export interface AdminDashboardProps {
  readonly onLogout: () => void;
}

const SECTION_TITLE: CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.5px',
  margin: '24px 0 10px',
};

const CARD: CSSProperties = {
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--card)',
  padding: '14px 15px',
};

/** ISO country code → flag emoji (regional indicator letters); 🌐 if unknown. */
function flag(country: string | null): string {
  if (!country || country.length !== 2) {
    return '🌐';
  }
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map((c) => base + (c.charCodeAt(0) - 65)),
  );
}

function Row(props: { left: ReactNode; right: ReactNode }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600, minWidth: 0 }}>
        {props.left}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700, flexShrink: 0 }}>
        {props.right}
      </span>
    </div>
  );
}

/**
 * Admin analytics dashboard (OBS-3). Pulls the derived snapshot from
 * GET /api/admin/stats and renders headline metrics, answer distributions,
 * most-missed questions, and a recent-activity feed from the events trail.
 */
export function AdminDashboard(props: AdminDashboardProps): JSX.Element {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setStats(await getAdminStats());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !stats) {
    return <StatusScreen title="Loading analytics…" />;
  }
  if (error && !stats) {
    return (
      <StatusScreen
        title="Could not load analytics"
        message="Please try again."
        tone="error"
        actionLabel="Retry"
        onAction={() => void load()}
      />
    );
  }
  if (!stats) {
    return <StatusScreen title="Loading analytics…" />;
  }

  const avg = stats.avgResponseMs === null ? '—' : `${(stats.avgResponseMs / 1000).toFixed(1)}s`;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 22px 32px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '26px',
          margin: '10px 0 2px',
          color: 'var(--ink)',
        }}
      >
        Analytics
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
        {stats.games.solo} solo · {stats.games.duel} duel · {stats.games.together} group
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '18px',
        }}
      >
        <ScoreStat
          label="Games played"
          value={stats.games.total}
          icon={<span aria-hidden>🎮</span>}
        />
        <ScoreStat label="Players" value={stats.players} icon={<span aria-hidden>🧑‍🤝‍🧑</span>} />
        <ScoreStat label="Answers" value={stats.answers} icon={<span aria-hidden>✍️</span>} />
        <ScoreStat
          label="Accuracy"
          value={`${stats.accuracyPct}%`}
          icon={<span aria-hidden>🎯</span>}
        />
        <ScoreStat label="Avg. time" value={avg} icon={<span aria-hidden>⏱️</span>} />
        <ScoreStat label="Questions" value={stats.questions} icon={<span aria-hidden>📚</span>} />
      </div>

      <p style={SECTION_TITLE}>PLAYERS</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        <ScoreStat
          label="Unique players"
          value={stats.users.unique}
          icon={<span aria-hidden>👤</span>}
        />
        <ScoreStat
          label="Returning"
          value={stats.users.returning}
          icon={<span aria-hidden>🔁</span>}
        />
        <ScoreStat
          label="New this week"
          value={stats.users.newThisWeek}
          icon={<span aria-hidden>✨</span>}
        />
        <ScoreStat
          label="Repeat rate"
          value={`${stats.users.repeatRatePct}%`}
          icon={<span aria-hidden>📈</span>}
        />
        <ScoreStat
          label="Games / player"
          value={stats.users.avgGamesPerPlayer}
          icon={<span aria-hidden>🎲</span>}
        />
      </div>

      <p style={SECTION_TITLE}>TOP PLAYERS</p>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stats.users.top.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No players yet.</span>
        ) : (
          stats.users.top.map((p) => (
            <Row
              key={p.nickname}
              left={p.nickname}
              right={`${p.games} game${p.games === 1 ? '' : 's'} · best ${p.best}`}
            />
          ))
        )}
      </div>

      <p style={SECTION_TITLE}>MOST-MISSED QUESTIONS</p>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stats.mostMissed.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No answers yet.</span>
        ) : (
          stats.mostMissed.map((q, i) => (
            <Row
              key={i}
              left={
                <span
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q.question}
                </span>
              }
              right={`${q.missRatePct}% (${q.missed}/${q.attempts})`}
            />
          ))
        )}
      </div>

      <p style={SECTION_TITLE}>BY CATEGORY</p>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stats.byCategory.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No answers yet.</span>
        ) : (
          stats.byCategory.map((c) => (
            <Row key={c.category} left={c.category} right={`${c.answers} · ${c.accuracyPct}%`} />
          ))
        )}
      </div>

      <p style={SECTION_TITLE}>BY DIFFICULTY</p>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stats.byDifficulty.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No answers yet.</span>
        ) : (
          stats.byDifficulty.map((d) => (
            <Row
              key={d.difficulty}
              left={<span style={{ textTransform: 'capitalize' }}>{d.difficulty}</span>}
              right={`${d.answers} · ${d.accuracyPct}%`}
            />
          ))
        )}
      </div>

      <p style={SECTION_TITLE}>BY LOCATION</p>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stats.locations.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>No location data yet.</span>
        ) : (
          stats.locations.map((loc) => (
            <Row
              key={loc.country ?? 'unknown'}
              left={
                <span>
                  {flag(loc.country)} {loc.country ?? 'Unknown'}
                </span>
              }
              right={`${loc.players} player${loc.players === 1 ? '' : 's'}`}
            />
          ))
        )}
      </div>

      <p style={SECTION_TITLE}>RECENT ACTIVITY</p>
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stats.recent.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Nothing yet.</span>
        ) : (
          stats.recent.map((e, i) => (
            <Row
              key={i}
              left={<span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{e.type}</span>}
              right={new Date(e.at).toLocaleTimeString()}
            />
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '11px', marginTop: '24px' }}>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
        <Button variant="ghost" onClick={props.onLogout}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
