import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  readonly leftIcon?: ReactNode;
  readonly children: ReactNode;
}

const SIZE_PADDING: Record<ButtonSize, string> = {
  sm: '9px 16px',
  md: '15px',
  lg: '17px',
};

const SIZE_FONT: Record<ButtonSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
};

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: {
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    boxShadow: 'var(--shadow-accent)',
  },
  secondary: {
    border: '2px solid var(--border-accent)',
    background: 'var(--card)',
    color: 'var(--accent-strong)',
  },
  ghost: {
    border: 'none',
    background: 'transparent',
    color: 'var(--accent-strong)',
    boxShadow: 'none',
  },
  warning: {
    border: '2px solid var(--warning-border)',
    background: 'var(--warning-tint)',
    color: 'var(--warning-ink)',
  },
};

/** Primary call-to-action button rendered in the prototype's four variants. */
export function Button(props: ButtonProps): JSX.Element {
  const {
    variant = 'primary',
    size = 'lg',
    fullWidth = true,
    leftIcon,
    children,
    style,
    ...rest
  } = props;

  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    width: fullWidth ? '100%' : undefined,
    padding: SIZE_PADDING[size],
    borderRadius: 'var(--radius-lg)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: SIZE_FONT[size],
    cursor: 'pointer',
    transition: 'transform var(--t) ease, border-color 0.15s',
  };

  return (
    <button type="button" style={{ ...base, ...VARIANT_STYLE[variant], ...style }} {...rest}>
      {leftIcon ? <span style={{ display: 'flex' }}>{leftIcon}</span> : null}
      {children}
    </button>
  );
}
