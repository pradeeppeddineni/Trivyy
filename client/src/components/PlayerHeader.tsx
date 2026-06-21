import { useRef, useState, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';

export interface PlayerHeaderProps {
  readonly nickname?: string;
  readonly onLogoClick?: () => void;
  /** When true the header sits on the dark gradient; use white text and a
   *  translucent background instead of the default light surface. */
  readonly lightText?: boolean;
  /** Navigate to the profile/me screen. */
  readonly onProfile?: () => void;
  /** Navigate to the settings screen. */
  readonly onSettings?: () => void;
  /** Called when the user confirms sign out. */
  readonly onSignOut?: () => void;
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
  cursor: 'pointer',
  font: 'inherit',
};

// ---- Account menu popover ---------------------------------------------------

interface AccountMenuProps {
  readonly lightText: boolean;
  readonly onProfile?: () => void;
  readonly onSettings?: () => void;
  readonly onSignOut?: () => void;
  readonly onClose: () => void;
}

const MENU_LIGHT: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  minWidth: '160px',
  background: '#fff',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
  zIndex: 100,
  overflow: 'hidden',
  animation: 'none',
};

const MENU_DARK: CSSProperties = {
  ...MENU_LIGHT,
  background: 'rgba(20,24,40,0.96)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

function menuItemStyle(danger?: boolean): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    font: 'inherit',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    color: danger ? 'var(--danger, #e02020)' : 'var(--ink)',
  };
}

function menuItemDarkStyle(danger?: boolean): CSSProperties {
  return {
    ...menuItemStyle(danger),
    color: danger ? '#ff6b6b' : '#fff',
  };
}

function AccountMenu({
  lightText,
  onProfile,
  onSettings,
  onSignOut,
  onClose,
}: AccountMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    function handleOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const menuStyle = lightText ? MENU_DARK : MENU_LIGHT;
  const itemStyle = lightText ? menuItemDarkStyle : menuItemStyle;

  const dividerStyle: CSSProperties = {
    height: '1px',
    background: lightText ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
    margin: '2px 0',
  };

  return (
    <div ref={menuRef} style={menuStyle} role="menu" aria-label="Account options">
      {onProfile ? (
        <button
          type="button"
          style={itemStyle()}
          role="menuitem"
          onClick={() => {
            onClose();
            onProfile();
          }}
        >
          Profile
        </button>
      ) : null}
      {onSettings ? (
        <button
          type="button"
          style={itemStyle()}
          role="menuitem"
          onClick={() => {
            onClose();
            onSettings();
          }}
        >
          Settings
        </button>
      ) : null}
      {(onProfile || onSettings) && onSignOut ? (
        <div style={dividerStyle} aria-hidden="true" />
      ) : null}
      {onSignOut ? (
        <button
          type="button"
          style={itemStyle(true)}
          role="menuitem"
          onClick={() => {
            onClose();
            onSignOut();
          }}
        >
          Sign out
        </button>
      ) : null}
    </div>
  );
}

// ---- Main component ---------------------------------------------------------

/** Sticky top bar with the Trivyy logo and the active player's nickname chip. */
export function PlayerHeader(props: PlayerHeaderProps): JSX.Element {
  const { nickname, onLogoClick, lightText = false, onProfile, onSettings, onSignOut } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);

  const initial = nickname ? nickname.charAt(0).toUpperCase() : '';
  const hasMenu = Boolean(onProfile || onSettings || onSignOut);

  const handleChipClick = useCallback(() => {
    if (hasMenu) setMenuOpen((prev) => !prev);
  }, [hasMenu]);

  const handleChipKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (hasMenu && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setMenuOpen((prev) => !prev);
      }
    },
    [hasMenu],
  );

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
        <div style={{ position: 'relative' }} ref={chipRef}>
          <button
            type="button"
            style={nickChipStyle}
            aria-label={hasMenu ? 'Account menu' : nickname}
            aria-haspopup={hasMenu ? 'menu' : undefined}
            aria-expanded={hasMenu ? menuOpen : undefined}
            onClick={handleChipClick}
            onKeyDown={handleChipKey}
          >
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
          </button>
          {menuOpen && hasMenu ? (
            <AccountMenu
              lightText={lightText}
              onProfile={onProfile}
              onSettings={onSettings}
              onSignOut={onSignOut}
              onClose={() => setMenuOpen(false)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
