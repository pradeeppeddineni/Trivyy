import type { CSSProperties, ReactNode } from 'react';

export interface ScoreStatProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly icon?: ReactNode;
}

const CARD: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--stat-border)',
  borderRadius: 'var(--radius-md)',
  padding: '15px',
  boxShadow: 'var(--shadow-card)',
};

/** Admin dashboard metric card: a labelled headline number with an icon. */
export function ScoreStat(props: ScoreStatProps): JSX.Element {
  const { label, value, icon } = props;

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        {icon ? <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span> : null}
        <span
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--faint)',
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '30px',
          margin: '8px 0 0',
          color: 'var(--ink)',
        }}
      >
        {value}
      </p>
    </div>
  );
}
