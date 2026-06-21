import type { CSSProperties } from 'react';

export interface PlayerHeaderProps {
  readonly nickname?: string;
  readonly onLogoClick?: () => void;
  /** When true the header sits on the dark gradient; use white text and a
   *  translucent background instead of the default light surface. */
  readonly lightText?: boolean;
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

const LOGO_GROUP: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  cursor: 'pointer',
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
  const { nickname, onLogoClick, lightText = false } = props;
  const initial = nickname ? nickname.charAt(0).toUpperCase() : '';

  const barStyle: CSSProperties = lightText
    ? {
        ...BAR,
        background: 'rgba(0,0,0,0.12)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }
    : BAR;

  const logoMark = (
    <>
      <span style={LOGO_MARK}>
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
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '21px',
          letterSpacing: '0.3px',
          color: lightText ? '#fff' : 'var(--ink)',
        }}
      >
        Trivyy
      </span>
    </>
  );

  const nickChipStyle: CSSProperties = lightText
    ? {
        ...NICK_CHIP,
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.3)',
      }
    : NICK_CHIP;

  return (
    <div style={barStyle}>
      {onLogoClick ? (
        <button type="button" onClick={onLogoClick} aria-label="Go to home" style={LOGO_GROUP}>
          {logoMark}
        </button>
      ) : (
        <div style={{ ...LOGO_GROUP, cursor: 'default' }}>{logoMark}</div>
      )}
      {nickname ? (
        <div style={nickChipStyle}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: lightText ? 'rgba(255,255,255,0.3)' : 'var(--accent)',
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
              color: lightText ? '#fff' : 'var(--accent-strong)',
            }}
          >
            {nickname}
          </span>
        </div>
      ) : null}
    </div>
  );
}
