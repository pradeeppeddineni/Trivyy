import type { CSSProperties } from 'react';
import { useTheme } from '../theme/ThemeProvider';

const TRACK = (on: boolean): CSSProperties => ({
  width: 46,
  height: 27,
  borderRadius: 'var(--radius-pill)',
  background: on ? 'var(--accent)' : 'var(--track)',
  position: 'relative',
  border: 'none',
  cursor: 'pointer',
  transition: 'background var(--t)',
  flex: '0 0 auto',
});

const KNOB = (on: boolean): CSSProperties => ({
  position: 'absolute',
  top: 3,
  left: on ? 22 : 3,
  width: 21,
  height: 21,
  borderRadius: '50%',
  background: '#fff',
  transition: 'left var(--t)',
});

export function ThemeToggle(): JSX.Element {
  const { theme, toggle } = useTheme();
  const on = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Dark mode"
      onClick={toggle}
      style={TRACK(on)}
    >
      <span style={KNOB(on)} />
    </button>
  );
}
