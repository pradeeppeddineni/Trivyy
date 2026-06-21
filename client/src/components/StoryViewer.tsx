import type { CSSProperties } from 'react';

// ---- Types ------------------------------------------------------------------

export interface StoryViewerProps {
  readonly nickname: string;
  readonly label: string;
  readonly detail?: string | null;
  readonly onClose: () => void;
}

// ---- Inline SVG icons -------------------------------------------------------

function CloseIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrophyIcon(): JSX.Element {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// ---- Styles -----------------------------------------------------------------

/**
 * Backdrop: a fixed overlay that closes the modal when clicked.
 * aria-hidden keeps it out of the accessibility tree; the visible scrim is
 * purely decorative. The dialog itself is a sibling, not a child, so it is
 * never hidden from AT by this attribute.
 */
const backdropSt: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  zIndex: 1000,
};

/**
 * Centering shell: sits on top of the backdrop (higher z-index) and provides
 * the flex container that centres the card. It does NOT have aria-hidden so
 * screen readers can reach the dialog within it.
 */
const centreShellSt: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001,
};

const cardSt: CSSProperties = {
  position: 'relative',
  maxWidth: '320px',
  width: '100%',
  padding: '28px',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--card)',
  boxShadow: 'var(--shadow-toast)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
};

const closeBtnSt: CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  width: '28px',
  height: '28px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface-muted)',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const ringWrapSt: CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'var(--warning-soft)',
  border: '2px solid var(--warning)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--warning)',
  flexShrink: 0,
};

// ---- Main component ---------------------------------------------------------

/**
 * Presentational modal that shows one friend's badge story.
 * No comment input, no reaction buttons — display only.
 *
 * Structure:
 *   backdrop div (aria-hidden, onClick=onClose)
 *   centering shell div (onClick=onClose)
 *     dialog card (role="dialog", onClick stops propagation)
 */
export function StoryViewer(props: StoryViewerProps): JSX.Element {
  const { nickname, label, detail, onClose } = props;

  function stopPropagation(e: React.MouseEvent): void {
    e.stopPropagation();
  }

  return (
    <>
      {/* Decorative scrim — aria-hidden so AT ignores it */}
      <div style={backdropSt} aria-hidden="true" />

      {/* Centering shell — clicking outside the card closes the modal */}
      <div style={centreShellSt} onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${nickname}'s story`}
          style={cardSt}
          onClick={stopPropagation}
        >
          {/* Close button */}
          <button type="button" style={closeBtnSt} onClick={onClose} aria-label="Close story">
            <CloseIcon />
          </button>

          {/* Nickname heading */}
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--ink)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {nickname}
          </h2>

          {/* Trophy icon with badge ring */}
          <div style={ringWrapSt}>
            <TrophyIcon />
          </div>

          {/* Badge label */}
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--ink-deep)',
              textAlign: 'center',
            }}
          >
            {label}
          </span>

          {/* Optional detail text */}
          {detail != null && detail !== '' ? (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--muted)',
                textAlign: 'center',
                margin: 0,
                marginTop: '8px',
              }}
            >
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
