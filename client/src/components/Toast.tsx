import type { CSSProperties } from 'react';

export interface ToastProps {
  readonly message: string;
  readonly icon?: string;
}

const TOAST: CSSProperties = {
  position: 'fixed',
  bottom: '28px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 90,
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  background: 'var(--ink-deep)',
  color: '#fff',
  padding: '13px 20px',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-toast)',
  fontSize: '14.5px',
  fontWeight: 600,
  animation: 'toastIn 0.3s var(--ease)',
  whiteSpace: 'nowrap',
};

/** Transient bottom-centered confirmation toast. */
export function Toast(props: ToastProps): JSX.Element {
  const { message, icon = '✅' } = props;

  return (
    <div style={TOAST} role="status">
      <span style={{ fontSize: '16px' }}>{icon}</span> {message}
    </div>
  );
}
