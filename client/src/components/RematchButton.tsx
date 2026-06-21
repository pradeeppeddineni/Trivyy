import type { CSSProperties } from 'react';
import type { SoloGameOptions } from '../api/client';

export interface RematchButtonProps {
  /** Called with the original game options when the player requests a rematch. */
  readonly onRematch: (options: SoloGameOptions) => void;
  /** The options used for the finished game — passed back unchanged to onRematch. */
  readonly options: SoloGameOptions;
  readonly disabled?: boolean;
}

const STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
  padding: '15px',
  borderRadius: 'var(--radius-lg)',
  border: '2px solid var(--border-accent)',
  background: 'var(--accent-soft)',
  color: 'var(--accent-strong)',
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '17px',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
  letterSpacing: '0.3px',
};

const DISABLED_STYLE: CSSProperties = {
  ...STYLE,
  opacity: 0.55,
  cursor: 'not-allowed',
};

/**
 * Re-creates a duel with the same options (category/region/count) and hands
 * control back to the parent via onRematch. Fully injectable for tests.
 */
export function RematchButton(props: RematchButtonProps): JSX.Element {
  const { onRematch, options, disabled = false } = props;

  return (
    <button
      type="button"
      style={disabled ? DISABLED_STYLE : STYLE}
      disabled={disabled}
      onClick={() => onRematch(options)}
      aria-label="Play again with the same settings"
    >
      Play again
    </button>
  );
}
