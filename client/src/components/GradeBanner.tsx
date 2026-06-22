import type { CSSProperties } from 'react';

export interface GradeBannerProps {
  readonly correct: boolean;
  readonly message?: string;
}

/** Post-answer feedback row showing a check/cross circle and a grade message. */
export function GradeBanner(props: GradeBannerProps): JSX.Element {
  const { correct, message } = props;
  const text = message ?? (correct ? 'Correct' : 'Not quite');

  const iconWrap: CSSProperties = {
    flex: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    background: correct
      ? 'linear-gradient(135deg, #16c079 0%, #16a765 100%)'
      : 'linear-gradient(135deg, #ff6b6b 0%, #e5484d 100%)',
    boxShadow: correct ? '0 3px 10px rgba(22,192,121,0.4)' : '0 3px 10px rgba(229,72,77,0.35)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'center',
      }}
    >
      <span style={iconWrap} aria-hidden="true">
        {correct ? '✓' : '✕'}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '20px',
          color: correct ? 'var(--success)' : 'var(--danger)',
          letterSpacing: '0.2px',
        }}
      >
        {text}
      </span>
    </div>
  );
}
