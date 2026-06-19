import type { CSSProperties } from 'react';
import { Button } from './Button';

export interface StatusScreenProps {
  readonly title: string;
  readonly message?: string;
  readonly tone?: 'info' | 'error';
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

const WRAP: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  gap: '14px',
  padding: '40px 24px',
};

/**
 * Shared loading / empty / error state used by the game screens so every screen
 * has explicit non-success states (ARC-4).
 */
export function StatusScreen(props: StatusScreenProps): JSX.Element {
  const { title, message, tone = 'info', actionLabel, onAction } = props;

  return (
    <main style={WRAP} role={tone === 'error' ? 'alert' : 'status'}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '24px',
          margin: 0,
          color: tone === 'error' ? 'var(--danger)' : 'var(--ink)',
        }}
      >
        {title}
      </h2>
      {message ? (
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0, maxWidth: '300px' }}>
          {message}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <div style={{ marginTop: '8px', width: '100%', maxWidth: '260px' }}>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </main>
  );
}
