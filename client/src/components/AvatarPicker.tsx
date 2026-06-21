import { useRef } from 'react';
import type { CSSProperties } from 'react';

// ---- Preset palette (mirrors server AVATAR_PRESETS) -------------------------

export type AvatarPresetKey = 'blue' | 'green' | 'pink' | 'amber' | 'violet' | 'teal';

export const AVATAR_PRESETS: ReadonlyArray<{ key: AvatarPresetKey; color: string; label: string }> =
  [
    { key: 'blue', color: '#1f6bff', label: 'Blue' },
    { key: 'green', color: '#16a765', label: 'Green' },
    { key: 'pink', color: '#e91e8c', label: 'Pink' },
    { key: 'amber', color: '#f5a623', label: 'Amber' },
    { key: 'violet', color: '#7c3aed', label: 'Violet' },
    { key: 'teal', color: '#0f9fa5', label: 'Teal' },
  ];

// ---- Props ------------------------------------------------------------------

export interface AvatarPickerProps {
  /** Currently active preset key, or null when an upload is active or none set. */
  readonly activePreset?: AvatarPresetKey | null;
  /** Called with the chosen preset key when a swatch is clicked. */
  readonly onPickPreset: (key: AvatarPresetKey) => void;
  /** Called with the selected File when the user picks an image to upload. */
  readonly onUploadFile: (file: File) => void;
}

// ---- Inline SVG -------------------------------------------------------------

function UploadIcon(): JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ---- Component --------------------------------------------------------------

/**
 * Controlled avatar picker: colour preset swatches + a file-upload trigger.
 * Purely presentational — all side effects are delegated via injected handlers
 * (onPickPreset, onUploadFile). No direct API calls inside.
 */
export function AvatarPicker(props: AvatarPickerProps): JSX.Element {
  const { activePreset, onPickPreset, onUploadFile } = props;
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    // Reset so the same file can be re-selected if needed.
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }

  const wrapper: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '4px',
  };

  const swatchRow: CSSProperties = {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const divider: CSSProperties = {
    height: '1px',
    background: 'var(--border-soft)',
    margin: '4px 0',
  };

  const uploadBtn: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px 16px',
    background: 'var(--card)',
    border: '2px dashed var(--border-dashed)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--accent-strong)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
    transition: 'border-color var(--t) ease, background var(--t) ease',
  };

  return (
    <div style={wrapper}>
      <p
        style={{
          margin: 0,
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--faint)',
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
        }}
      >
        Choose a colour
      </p>
      <div style={swatchRow} role="radiogroup" aria-label="Preset avatar colours">
        {AVATAR_PRESETS.map(({ key, color, label }) => {
          const isActive = activePreset === key;
          const swatch: CSSProperties = {
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: color,
            border: isActive ? '3px solid var(--ink)' : '3px solid transparent',
            boxShadow: isActive ? `0 0 0 2px ${color}40` : 'var(--shadow-card)',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.12s',
            transform: isActive ? 'scale(1.12)' : 'scale(1)',
          };
          return (
            <button
              key={key}
              type="button"
              style={swatch}
              aria-label={label}
              aria-pressed={isActive}
              role="radio"
              aria-checked={isActive}
              onClick={() => onPickPreset(key)}
            />
          );
        })}
      </div>

      <div style={divider} />

      <p
        style={{
          margin: 0,
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--faint)',
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
        }}
      >
        Or upload a photo
      </p>
      {/* Hidden file input; the visible button triggers it. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        aria-hidden="true"
        onChange={handleFileChange}
      />
      <button
        type="button"
        style={uploadBtn}
        onClick={() => fileRef.current?.click()}
        aria-label="Upload a photo"
      >
        <span style={{ display: 'flex', color: 'var(--accent)' }}>
          <UploadIcon />
        </span>
        Upload photo
      </button>
    </div>
  );
}
