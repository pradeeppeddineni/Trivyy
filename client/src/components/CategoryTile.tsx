import type { CSSProperties } from 'react';

export interface CategoryTileProps {
  readonly icon: string;
  readonly label: string;
  readonly selected?: boolean;
  readonly onClick?: () => void;
}

/** Grid tile for picking a quiz category; highlights when selected. */
export function CategoryTile(props: CategoryTileProps): JSX.Element {
  const { icon, label, selected = false, onClick } = props;

  const style: CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px 12px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'transform var(--t) ease, border-color 0.15s',
    border: selected ? '2px solid var(--accent)' : '2px solid var(--border)',
    background: selected ? 'var(--accent-soft)' : 'var(--card)',
    color: selected ? 'var(--accent-strong)' : 'var(--ink)',
    boxShadow: selected ? 'var(--shadow-accent-soft)' : 'var(--shadow-card)',
  };

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} style={style}>
      <span style={{ fontSize: '26px', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '14.5px', fontWeight: 600, marginTop: '7px' }}>{label}</span>
    </button>
  );
}
