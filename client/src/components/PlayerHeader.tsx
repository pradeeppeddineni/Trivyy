import type { CSSProperties } from 'react';

export interface PlayerHeaderProps {
  readonly nickname?: string;
  readonly onLogoClick?: () => void;
}

const BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 18px',
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: 'rgba(252, 252, 254, 0.86)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid var(--border-faint)',
};

const LOGO_MARK: CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--accent)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 4px 10px var(--accent-glow)',
};

const NICK_CHIP: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  background: 'var(--accent-soft)',
  border: '1px solid var(--border-accent-soft)',
  padding: '6px 12px 6px 8px',
  borderRadius: 'var(--radius-pill)',
};

/** Sticky top bar with the Trivyy logo and the active player's nickname chip. */
export function PlayerHeader(props: PlayerHeaderProps): JSX.Element {
  const { nickname, onLogoClick } = props;
  const initial = nickname ? nickname.charAt(0).toUpperCase() : '';

  return (
    <div style={BAR}>
      <div
        onClick={onLogoClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          cursor: onLogoClick ? 'pointer' : 'default',
        }}
      >
        <div style={LOGO_MARK}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: '#fff',
              fontSize: '20px',
              lineHeight: 1,
            }}
          >
            T
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '21px',
            letterSpacing: '0.3px',
            color: 'var(--ink)',
          }}
        >
          Trivyy
        </span>
      </div>
      {nickname ? (
        <div style={NICK_CHIP}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--accent-strong)',
            }}
          >
            {nickname}
          </span>
        </div>
      ) : null}
    </div>
  );
}
