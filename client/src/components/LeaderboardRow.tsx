import type { CSSProperties } from 'react';

export interface LeaderboardRowProps {
  readonly rank: number;
  readonly name: string;
  readonly score: number;
  readonly total: number;
  /** Percentage / subtitle line under the name. */
  readonly detail?: string;
  readonly isWinner?: boolean;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** Ranked leaderboard entry; the winner row gets the success highlight. */
export function LeaderboardRow(props: LeaderboardRowProps): JSX.Element {
  const { rank, name, score, total, detail, isWinner = false } = props;

  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    borderRadius: 'var(--radius-md)',
    padding: '14px 15px',
    border: isWinner ? '2px solid var(--success-strong)' : '1px solid var(--border-soft)',
    background: isWinner ? 'var(--winner-tint)' : 'var(--card)',
    boxShadow: isWinner ? 'var(--shadow-winner)' : 'var(--shadow-card)',
  };

  const avatar: CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: isWinner ? 'var(--success-strong)' : 'var(--accent)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '16px',
    flex: 'none',
  };

  return (
    <div style={row}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '18px',
          width: '26px',
          textAlign: 'center',
          color: isWinner ? 'var(--success)' : 'var(--faint-soft)',
        }}
      >
        {rank}
      </span>
      <div style={avatar}>{name ? name.charAt(0).toUpperCase() : '?'}</div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '15.5px',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {name} {MEDALS[rank] ?? ''}
        </p>
        {detail ? (
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--faint)',
              margin: '1px 0 0',
              fontWeight: 600,
            }}
          >
            {detail}
          </p>
        ) : null}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '24px',
          color: isWinner ? 'var(--success)' : 'var(--accent)',
        }}
      >
        {score}
        <span style={{ fontSize: '14px', color: 'var(--score-total)' }}>/{total}</span>
      </span>
    </div>
  );
}
