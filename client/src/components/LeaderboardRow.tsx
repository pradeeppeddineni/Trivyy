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

// ---- Rank badge (replaces emoji medals) -------------------------------------

interface RankBadgeProps {
  readonly rank: number;
}

const MEDAL_STYLES: Record<number, { bg: string; border: string; color: string; label: string }> = {
  1: {
    bg: 'var(--gold-bg)',
    border: 'var(--gold-border)',
    color: 'var(--gold)',
    label: '1st place',
  },
  2: {
    bg: 'var(--silver-bg)',
    border: 'var(--silver-border)',
    color: 'var(--silver)',
    label: '2nd place',
  },
  3: {
    bg: 'var(--bronze-bg)',
    border: 'var(--bronze-border)',
    color: 'var(--bronze)',
    label: '3rd place',
  },
};

function RankBadge({ rank }: RankBadgeProps): JSX.Element {
  const medal = MEDAL_STYLES[rank];

  if (medal) {
    const disc: CSSProperties = {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: medal.bg,
      border: `2px solid ${medal.border}`,
      flexShrink: 0,
    };
    const num: CSSProperties = {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '13px',
      color: medal.color,
      lineHeight: 1,
    };
    return (
      <div style={disc} aria-label={medal.label}>
        <span style={num} aria-hidden="true">
          {rank}
        </span>
      </div>
    );
  }

  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '18px',
        width: '28px',
        textAlign: 'center',
        color: 'var(--faint-soft)',
        flexShrink: 0,
      }}
    >
      {rank}
    </span>
  );
}

// ---- Main component ---------------------------------------------------------

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
      <RankBadge rank={rank} />
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
          {name}
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
