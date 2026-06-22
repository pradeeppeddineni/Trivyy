import type { CSSProperties } from 'react';
import { CategoryIcon, CATEGORY_COLORS } from './CategoryIcon';

export interface CategoryTileProps {
  /** Category slug — passed to CategoryIcon and used to pick the accent color. */
  readonly icon: string;
  readonly label: string;
  readonly selected?: boolean;
  readonly onClick?: () => void;
}

/** Grid tile for picking a quiz category; highlights when selected. */
export function CategoryTile(props: CategoryTileProps): JSX.Element {
  const { icon, label, selected = false, onClick } = props;

  const accentColor = CATEGORY_COLORS[icon] ?? 'var(--accent)';

  const style: CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px 12px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'transform var(--t) ease, border-color 0.15s, box-shadow 0.15s',
    border: selected ? `2px solid ${accentColor}` : '2px solid var(--border)',
    background: selected ? `${accentColor}18` : 'var(--card)',
    color: selected ? accentColor : 'var(--ink)',
    boxShadow: selected ? `0 4px 14px ${accentColor}30` : 'var(--shadow-card)',
  };

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} style={style}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: selected ? `${accentColor}22` : 'var(--card-tint)',
          color: selected ? accentColor : (CATEGORY_COLORS[icon] ?? 'var(--muted)'),
          marginBottom: '6px',
        }}
      >
        <CategoryIcon slug={icon} size={20} />
      </span>
      <span style={{ fontSize: '14.5px', fontWeight: 600 }}>{label}</span>
    </button>
  );
}
