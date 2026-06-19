import type { CSSProperties } from 'react';

export interface LogoProps {
  readonly size?: number;
}

/**
 * The Trivyy brand mark from the design prototype: a rounded accent square with
 * a white display-font "T". Single source of truth so every screen (home, the
 * mode prompts, admin sign-in) shows the same logo instead of ad-hoc emoji.
 */
export function Logo(props: LogoProps): JSX.Element {
  const { size = 92 } = props;
  const wrap: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: 'var(--radius-xl)',
    background: 'var(--accent)',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'var(--shadow-logo)',
  };
  return (
    <div style={wrap} aria-hidden>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: '#fff',
          fontSize: `${Math.round(size * 0.56)}px`,
          lineHeight: 1,
          marginTop: '-2px',
        }}
      >
        T
      </span>
    </div>
  );
}
