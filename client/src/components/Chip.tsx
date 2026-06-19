import type { CSSProperties } from 'react';

export interface ChipProps {
  readonly label: string;
  readonly selected?: boolean;
  readonly onClick?: () => void;
  readonly flex?: boolean;
}

/** Selectable pill used for difficulty and question-count choices. */
export function Chip(props: ChipProps): JSX.Element {
  const { label, selected = false, onClick, flex = true } = props;

  const style: CSSProperties = {
    flex: flex ? 1 : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform var(--t) ease, border-color 0.15s',
    border: selected ? '2px solid var(--accent)' : '2px solid var(--border)',
    background: selected ? 'var(--accent-soft)' : 'var(--card)',
    color: selected ? 'var(--accent-strong)' : 'var(--body-soft)',
  };

  return (
    <div onClick={onClick} style={style}>
      {label}
    </div>
  );
}
