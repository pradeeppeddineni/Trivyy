import type { CSSProperties, ReactNode } from 'react';
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
  alignItems: 'stretch',
  justifyContent: 'space-around',
};

function tabStyle(isActive: boolean): CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isActive ? 'var(--accent)' : 'var(--muted)',
    padding: '6px 4px',
  };
}

// ---- Inline SVG icons -------------------------------------------------------

function HomeIcon(): ReactNode {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 13 15 13 15 21" />
    </svg>
  );
}

function FriendsIcon(): ReactNode {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function BoardsIcon(): ReactNode {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function YouIcon(): ReactNode {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

const TAB_ICONS: Record<string, () => ReactNode> = {
  home: HomeIcon,
  friends: FriendsIcon,
  boards: BoardsIcon,
  you: YouIcon,
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
        {TAB_ITEMS.map((t) => {
          const IconComponent = TAB_ICONS[t.key];
          return (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active === t.key ? 'page' : undefined}
              onClick={() => go(t.search)}
              style={tabStyle(active === t.key)}
            >
              {IconComponent ? <IconComponent /> : null}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
