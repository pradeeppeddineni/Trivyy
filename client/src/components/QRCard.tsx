import type { CSSProperties } from 'react';

export interface QRCardProps {
  readonly caption?: string;
  readonly size?: number;
}

const WRAP: CSSProperties = {
  background: '#fff',
  borderRadius: 'var(--radius-md)',
  padding: '14px',
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '7px',
};

/**
 * Placeholder QR box. The real client-generated QR code arrives in Phase 4;
 * this renders a labelled square so the lobby layout is reviewable now.
 */
export function QRCard(props: QRCardProps): JSX.Element {
  const { caption = 'SCAN TO JOIN', size = 128 } = props;

  const placeholder: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: 'var(--radius-sm)',
    display: 'grid',
    placeItems: 'center',
    background:
      'repeating-conic-gradient(var(--ink-deep) 0deg 90deg, #fff 90deg 180deg) 0 0 / 16px 16px',
    color: 'var(--faint)',
  };

  return (
    <div style={WRAP}>
      <div style={placeholder} aria-label="QR code placeholder">
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            background: '#fff',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          QR
        </span>
      </div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--faint)',
          letterSpacing: '0.5px',
        }}
      >
        {caption}
      </span>
    </div>
  );
}
