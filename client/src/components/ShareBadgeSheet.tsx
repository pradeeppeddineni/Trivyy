import type { CSSProperties } from 'react';

// ---- Props ------------------------------------------------------------------

export interface ShareBadgeSheetProps {
  /** Only earned achievements should be passed (already filtered by caller). */
  readonly achievements: ReadonlyArray<{
    readonly key: string;
    readonly label: string;
    readonly description: string;
  }>;
  readonly onShare: (badge: { label: string; detail: string }) => void;
  readonly onClose: () => void;
}

// ---- Icons ------------------------------------------------------------------

function CloseIcon(): JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---- Styles -----------------------------------------------------------------

const BACKDROP: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 100,
};

const SHEET: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  maxWidth: 'var(--app-width)',
  margin: '0 auto',
  background: 'var(--card)',
  borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
  padding: '24px',
  boxShadow: 'var(--shadow-toast)',
  zIndex: 101,
};

const DRAG_HANDLE: CSSProperties = {
  width: '36px',
  height: '4px',
  background: 'var(--border-soft)',
  borderRadius: 'var(--radius-pill)',
  margin: '0 auto',
};

const HEADER_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '16px',
};

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '18px',
  color: 'var(--ink)',
};

const CLOSE_BTN: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--muted)',
  padding: '4px',
  borderRadius: 'var(--radius-md)',
};

const SUB_LABEL: CSSProperties = {
  margin: '6px 0 16px',
  fontSize: '13px',
  color: 'var(--muted)',
};

const ITEM_LIST: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const ITEM_BTN: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  background: 'var(--surface-muted)',
  cursor: 'pointer',
};

const ITEM_LABEL: CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--ink)',
};

const ITEM_DESC: CSSProperties = {
  margin: '3px 0 0',
  fontSize: '12px',
  color: 'var(--muted)',
};

const EMPTY_MSG: CSSProperties = {
  fontSize: '14px',
  color: 'var(--muted)',
  margin: '8px 0 0',
};

// ---- Component --------------------------------------------------------------

/**
 * Bottom sheet for sharing an earned achievement badge.
 * Presentational: no fetching — achievements are passed via props.
 */
export function ShareBadgeSheet(props: ShareBadgeSheetProps): JSX.Element {
  const { achievements, onShare, onClose } = props;

  function handleSheetClick(e: React.MouseEvent<HTMLDivElement>): void {
    e.stopPropagation();
  }

  return (
    <>
      {/* Backdrop: clicking calls onClose */}
      <div style={BACKDROP} onClick={onClose} aria-hidden="true" data-testid="backdrop" />

      {/* Sheet card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share a badge story"
        style={SHEET}
        onClick={handleSheetClick}
      >
        {/* Drag handle — decorative */}
        <div style={DRAG_HANDLE} />

        {/* Header */}
        <div style={HEADER_ROW}>
          <h2 style={TITLE}>Share a badge</h2>
          <button type="button" style={CLOSE_BTN} aria-label="Close sheet" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <p style={SUB_LABEL}>Pick one of your earned achievements to share</p>

        {/* Achievement list */}
        {achievements.length === 0 ? (
          <p style={EMPTY_MSG}>No earned achievements yet. Keep playing!</p>
        ) : (
          <div style={ITEM_LIST}>
            {achievements.map((achievement) => (
              <button
                key={achievement.key}
                type="button"
                style={ITEM_BTN}
                aria-label={`Share ${achievement.label}`}
                onClick={() =>
                  onShare({ label: achievement.label, detail: achievement.description })
                }
              >
                <p style={ITEM_LABEL}>{achievement.label}</p>
                <p style={ITEM_DESC}>{achievement.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
