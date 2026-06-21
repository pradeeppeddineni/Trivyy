import type { CSSProperties } from 'react';

export interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
}

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

export function Switch({ checked, onChange, label }: SwitchProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={TRACK(checked)}
    >
      <span style={KNOB(checked)} />
    </button>
  );
}
