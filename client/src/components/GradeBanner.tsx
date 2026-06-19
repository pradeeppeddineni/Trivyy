import type { CSSProperties } from 'react';

export interface GradeBannerProps {
  readonly correct: boolean;
  readonly message?: string;
}

/** Post-answer feedback row showing a check/cross and a grade message. */
export function GradeBanner(props: GradeBannerProps): JSX.Element {
  const { correct, message } = props;
  const text = message ?? (correct ? 'Correct' : 'Not quite');

  const iconWrap: CSSProperties = {
    flex: 'none',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    background: correct ? 'var(--success-strong)' : 'var(--danger-bar)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'center',
      }}
    >
      <span style={iconWrap}>{correct ? '✓' : '✕'}</span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '18px',
          color: correct ? 'var(--success)' : 'var(--danger)',
        }}
      >
        {text}
      </span>
    </div>
  );
}
