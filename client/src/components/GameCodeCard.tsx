import type { CSSProperties, ReactNode } from 'react';

export interface GameCodeCardProps {
  readonly code: string;
  readonly label?: string;
  /** Optional content rendered below the code, e.g. a QR card. */
  readonly children?: ReactNode;
}

const CARD: CSSProperties = {
  background: 'var(--accent)',
  borderRadius: 'var(--radius-xl)',
  padding: '20px',
  boxShadow: 'var(--shadow-accent-card)',
  textAlign: 'center',
};

/** Accent card that displays a shareable game code (duel / group lobby). */
export function GameCodeCard(props: GameCodeCardProps): JSX.Element {
  const { code, label = 'GAME CODE', children } = props;

  return (
    <div style={CARD}>
      <p
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: '2px',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '42px',
          letterSpacing: '8px',
          color: '#fff',
          margin: children ? '5px 0 14px' : '6px 0 0',
        }}
      >
        {code}
      </p>
      {children}
    </div>
  );
}
