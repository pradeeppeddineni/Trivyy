import type { CSSProperties } from 'react';
import { TAB_ITEMS } from '../nav';

export interface BottomNavProps {
  readonly active: string;
  /** Injected for tests; defaults to changing the window query string. */
  readonly onNavigate?: (search: string) => void;
}

const BAR: CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 'calc(12px + env(safe-area-inset-bottom))',
  width: 'min(var(--app-width), 100vw)',
  paddingLeft: 12,
  paddingRight: 12,
  boxSizing: 'border-box',
  zIndex: 40,
};

const INNER: CSSProperties = {
  height: 64,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-2xl)',
  boxShadow: 'var(--shadow-frame)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
};

function tabStyle(isActive: boolean): CSSProperties {
  return {
    display: 'grid',
    placeItems: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isActive ? 'var(--accent)' : 'var(--muted)',
  };
}

const PLAY: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 'var(--radius-xl)',
  background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'var(--shadow-accent)',
  transform: 'translateY(-14px)',
  border: '4px solid var(--surface)',
  cursor: 'pointer',
};

export function BottomNav({ active, onNavigate }: BottomNavProps): JSX.Element {
  const go =
    onNavigate ??
    ((s: string) => {
      window.location.search = s;
    });
  return (
    <nav style={BAR} aria-label="Primary">
      <div style={INNER}>
        {TAB_ITEMS.map((t) =>
          t.primary ? (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active === t.key ? 'page' : undefined}
              onClick={() => go(t.search)}
              style={{ background: 'transparent', border: 'none' }}
            >
              <span style={PLAY}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active === t.key ? 'page' : undefined}
              onClick={() => go(t.search)}
              style={tabStyle(active === t.key)}
            >
              {t.label}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
