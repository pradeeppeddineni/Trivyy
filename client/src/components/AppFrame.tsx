import type { CSSProperties, ReactNode } from 'react';

export interface AppFrameProps {
  readonly children: ReactNode;
}

const FRAME: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 'var(--app-width)',
  margin: '0 auto',
  minHeight: '100dvh',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow-frame)',
  display: 'flex',
  flexDirection: 'column',
};

/** Mobile-first phone frame that wraps every screen (design source of truth). */
export function AppFrame(props: AppFrameProps): JSX.Element {
  return <div style={FRAME}>{props.children}</div>;
}
