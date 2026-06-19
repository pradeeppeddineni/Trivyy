import type { CSSProperties } from 'react';
import { Button } from './Button';

export type PlayerRowStatus = 'waiting' | 'ready' | 'playing' | 'done';

export interface PlayerRowProps {
  readonly name: string;
  readonly statusText: string;
  readonly status?: PlayerRowStatus;
  readonly isYou?: boolean;
  /** Score label shown on the right once the player has finished. */
  readonly scoreText?: string;
  /** When provided, renders a play action button (host's turn control). */
  readonly playLabel?: string;
  readonly onPlay?: () => void;
}

const ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'var(--card)',
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius-md)',
  padding: '11px 13px',
  boxShadow: 'var(--shadow-card-soft)',
};

const AVATAR: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--accent)',
  color: '#fff',
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '16px',
  flex: 'none',
};

/** Lobby roster row: avatar, name, status, and an optional play/score slot. */
export function PlayerRow(props: PlayerRowProps): JSX.Element {
  const { name, statusText, isYou = false, scoreText, playLabel, onPlay } = props;
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div style={ROW}>
      <div style={AVATAR}>{initial}</div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {name}
          {isYou ? <span style={{ color: 'var(--faint-soft)' }}> (you)</span> : null}
        </p>
        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--faint)',
            margin: '1px 0 0',
            fontWeight: 600,
          }}
        >
          {statusText}
        </p>
      </div>
      {playLabel ? (
        <Button size="sm" fullWidth={false} onClick={onPlay}>
          {playLabel}
        </Button>
      ) : null}
      {scoreText ? (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '16px',
            color: 'var(--success)',
          }}
        >
          {scoreText}
        </span>
      ) : null}
    </div>
  );
}
