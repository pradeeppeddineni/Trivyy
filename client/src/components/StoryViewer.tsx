import { useEffect } from 'react';
import type { CSSProperties } from 'react';

// ---- Types ------------------------------------------------------------------

export interface StoryViewerProps {
  readonly nickname: string;
  readonly label: string;
  readonly detail?: string | null;
  readonly onClose: () => void;
  /** Auto-advance duration in ms; the progress bar fills over this time. */
  readonly durationMs?: number;
}

const STORY_DURATION_MS = 5000;

// ---- Inline SVG icons -------------------------------------------------------

function CloseIcon(): JSX.Element {
  return (
    <svg
      width="20"
      height="20"
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
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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
 * Backdrop: a plain dark fill behind the story panel (kept as a separate first
 * child so the existing two-child structure and outside-click handling hold).
 */
const backdropSt: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#000',
  zIndex: 1000,
};

/** Full-screen shell. Tapping it (outside the panel content) closes the story. */
const shellSt: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1001,
  display: 'flex',
  justifyContent: 'center',
};

/** The full-bleed story panel — an Instagram-style vertical, edge-to-edge view. */
const panelSt: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 'var(--app-width)',
  height: '100dvh',
  background: 'linear-gradient(160deg, var(--accent) 0%, #7a3df1 55%, #e0489c 100%)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  padding: 'calc(14px + env(safe-area-inset-top)) 18px calc(24px + env(safe-area-inset-bottom))',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const progressTrackSt: CSSProperties = {
  height: '3px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.35)',
  overflow: 'hidden',
  flexShrink: 0,
};

const headerSt: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginTop: '16px',
  flexShrink: 0,
};

const avatarSt: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.2)',
  border: '2px solid rgba(255,255,255,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '18px',
  flexShrink: 0,
};

const closeBtnSt: CSSProperties = {
  marginLeft: 'auto',
  width: '36px',
  height: '36px',
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.18)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  flexShrink: 0,
};

const badgeRingSt: CSSProperties = {
  width: '132px',
  height: '132px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.16)',
  border: '3px solid rgba(255,255,255,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
};

// ---- Main component ---------------------------------------------------------

/**
 * Full-page (Instagram-style) story viewer for one friend's badge.
 * Display only: no comment input, no reactions. Auto-advances (closes) after
 * `durationMs`; the user can also tap the close button or outside the panel.
 *
 * Structure (preserved across the redesign):
 *   backdrop div (aria-hidden)            <- container.children[0]
 *   shell div (onClick=onClose)           <- container.children[1]
 *     panel (onClick stops propagation)
 */
export function StoryViewer(props: StoryViewerProps): JSX.Element {
  const { nickname, label, detail, onClose, durationMs = STORY_DURATION_MS } = props;

  // Auto-advance: close when the progress bar completes. Cleared on unmount.
  useEffect(() => {
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [onClose, durationMs]);

  function stopPropagation(e: React.MouseEvent): void {
    e.stopPropagation();
  }

  const initial = nickname.charAt(0).toUpperCase();

  return (
    <>
      {/* Dark backing fill */}
      <div style={backdropSt} aria-hidden="true" />

      {/* Full-screen shell — tapping outside the panel closes */}
      <div style={shellSt} onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${nickname}'s story`}
          style={panelSt}
          onClick={stopPropagation}
        >
          <style>
            {`@keyframes trivyyStoryFill { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}
          </style>

          {/* Progress bar (fills over durationMs) */}
          <div
            style={progressTrackSt}
            role="progressbar"
            aria-label="Story progress"
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                height: '100%',
                background: '#fff',
                borderRadius: '999px',
                animation: `trivyyStoryFill ${durationMs}ms linear forwards`,
              }}
            />
          </div>

          {/* Header: avatar + name + close */}
          <div style={headerSt}>
            <span style={avatarSt} aria-hidden="true">
              {initial}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#fff',
                }}
              >
                {nickname}
              </h2>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>shared a badge</span>
            </div>
            <button type="button" style={closeBtnSt} onClick={onClose} aria-label="Close story">
              <CloseIcon />
            </button>
          </div>

          {/* Centered badge */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
              textAlign: 'center',
            }}
          >
            <div style={badgeRingSt}>
              <TrophyIcon />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '26px',
                fontWeight: 700,
              }}
            >
              {label}
            </span>
            {detail != null && detail !== '' ? (
              <p style={{ fontSize: '15px', opacity: 0.9, margin: 0, maxWidth: '260px' }}>
                {detail}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
