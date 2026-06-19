import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Gallery } from './pages/Gallery';
import { Home } from './pages/Home';

type View = 'gallery' | 'home';

const TAB_BAR: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 30,
  display: 'flex',
  gap: '6px',
  padding: '10px 16px',
  background: 'var(--page-bg)',
  borderBottom: '1px solid var(--border-soft)',
};

function tabStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '14px',
    background: active ? 'var(--accent)' : 'var(--card)',
    color: active ? '#fff' : 'var(--body-soft)',
  };
}

export function App(): JSX.Element {
  const [view, setView] = useState<View>('gallery');

  return (
    <>
      <nav style={TAB_BAR}>
        <button
          type="button"
          style={tabStyle(view === 'gallery')}
          onClick={() => setView('gallery')}
        >
          Gallery
        </button>
        <button type="button" style={tabStyle(view === 'home')} onClick={() => setView('home')}>
          Home
        </button>
      </nav>
      {view === 'gallery' ? <Gallery /> : <Home />}
    </>
  );
}
