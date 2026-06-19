import type { CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface QRCardProps {
  /** The URL the QR encodes (e.g. the join link). */
  readonly value: string;
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
 * Client-generated QR code for the join link. Renders inline SVG via
 * `qrcode.react` — fully bundled, no network request, so it satisfies the
 * self-hosted CSP (OP/SEC). Phones scan it to open the join URL directly.
 */
export function QRCard(props: QRCardProps): JSX.Element {
  const { value, caption = 'SCAN TO JOIN', size = 128 } = props;

  return (
    <div style={WRAP}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={0}
        title="QR code to join the game"
      />
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
