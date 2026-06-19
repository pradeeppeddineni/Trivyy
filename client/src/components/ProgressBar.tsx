import type { CSSProperties } from 'react';

export interface ProgressBarProps {
  /** Completion ratio from 0 to 1. */
  readonly value: number;
  readonly trackColor?: string;
  readonly fillColor?: string;
  readonly height?: number;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** Slim rounded progress bar used in gameplay and the admin dashboard. */
export function ProgressBar(props: ProgressBarProps): JSX.Element {
  const { value, trackColor = 'var(--track)', fillColor = 'var(--accent)', height = 9 } = props;

  const track: CSSProperties = {
    height: `${height}px`,
    borderRadius: 'var(--radius-pill)',
    background: trackColor,
    overflow: 'hidden',
  };

  const fill: CSSProperties = {
    height: '100%',
    borderRadius: 'var(--radius-pill)',
    background: fillColor,
    width: `${clamp(value) * 100}%`,
    transition: 'width 0.5s var(--ease)',
  };

  return (
    <div style={track}>
      <div style={fill} />
    </div>
  );
}
