import type { CSSProperties } from 'react';

export interface CategoryIconProps {
  /** Category slug, legacy emoji, or label — resolved to a canonical slug. */
  readonly slug: string;
  /** Icon size in pixels (width and height). Defaults to 24. */
  readonly size?: number;
}

/** Legacy emoji icons (from the server / older data) → canonical slug. */
const EMOJI_TO_SLUG: Readonly<Record<string, string>> = {
  '🔬': 'science',
  '🌍': 'geography',
  '🎬': 'movies',
  '🎵': 'music',
  '📜': 'history',
  '💻': 'tech',
  '🎲': 'any',
};

const KNOWN_SLUGS = new Set(['science', 'geography', 'movies', 'music', 'history', 'tech', 'any']);

/**
 * Resolve a category slug from a slug, a legacy emoji icon, or a display label
 * (e.g. the server still sends the emoji or "Science"). Falls back to 'any'.
 */
export function normalizeCategorySlug(input: string | null | undefined): string {
  if (!input) return 'any';
  const v = input.trim();
  if (KNOWN_SLUGS.has(v)) return v;
  if (EMOJI_TO_SLUG[v]) return EMOJI_TO_SLUG[v];
  const lower = v.toLowerCase();
  if (KNOWN_SLUGS.has(lower)) return lower;
  if (lower.startsWith('surprise')) return 'any';
  return 'any';
}

/** Inline SVG category icon. Uses currentColor so the parent controls the hue. */
export function CategoryIcon({ slug, size = 24 }: CategoryIconProps): JSX.Element {
  const style: CSSProperties = {
    display: 'block',
    width: size,
    height: size,
    flexShrink: 0,
  };

  switch (normalizeCategorySlug(slug)) {
    case 'science':
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          {/* Flask body */}
          <path
            d="M9 3h6M10 3v5.5L6.5 15a4.5 4.5 0 0 0 11 0L14 8.5V3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Liquid bubbles */}
          <circle cx="10.5" cy="16" r="1" fill="currentColor" />
          <circle cx="13.5" cy="14.5" r="0.7" fill="currentColor" />
        </svg>
      );

    case 'geography':
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          {/* Latitude lines */}
          <path d="M3 12h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          {/* Longitude curve */}
          <path
            d="M12 3c-3 3-3 6 0 9s3 6 0 9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M12 3c3 3 3 6 0 9s-3 6 0 9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'movies':
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          {/* Clapperboard base */}
          <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          {/* Clapper top bar */}
          <rect
            x="3"
            y="4"
            width="18"
            height="4"
            rx="1"
            fill="currentColor"
            opacity="0.25"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* Clapper stripes */}
          <line
            x1="7"
            y1="4"
            x2="5"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="11"
            y1="4"
            x2="9"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="15"
            y1="4"
            x2="13"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="19"
            y1="4"
            x2="17"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Play triangle */}
          <path d="M10 12l5 2.5-5 2.5V12z" fill="currentColor" />
        </svg>
      );

    case 'music':
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          {/* Note stem */}
          <path
            d="M9 17V7l10-2v10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Note heads */}
          <circle cx="7" cy="17" r="2.5" fill="currentColor" />
          <circle cx="17" cy="15" r="2.5" fill="currentColor" />
        </svg>
      );

    case 'history':
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          {/* Scroll body */}
          <path
            d="M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* Scroll curl bottom */}
          <path
            d="M4 18a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Text lines */}
          <line
            x1="8"
            y1="9"
            x2="16"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="12"
            x2="16"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="15"
            x2="13"
            y2="15"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'tech':
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          {/* Chip body */}
          <rect
            x="7"
            y="7"
            width="10"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* Inner core */}
          <rect
            x="9.5"
            y="9.5"
            width="5"
            height="5"
            rx="0.5"
            fill="currentColor"
            opacity="0.3"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          {/* Pins top/bottom */}
          <line
            x1="9"
            y1="4"
            x2="9"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="15"
            y1="4"
            x2="15"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="9"
            y1="17"
            x2="9"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="17"
            x2="12"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="15"
            y1="17"
            x2="15"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Pins left/right */}
          <line
            x1="4"
            y1="9"
            x2="7"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="7"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="15"
            x2="7"
            y2="15"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="17"
            y1="9"
            x2="20"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="17"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <line
            x1="17"
            y1="15"
            x2="20"
            y2="15"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'any':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true" focusable="false">
          {/* Dice face */}
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* Dots: 1-2-1 layout (5 face) */}
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="8" cy="16" r="1.5" fill="currentColor" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * Per-category brand colors. Consumed by tiles/headers to tint
 * the icon and background consistently.
 */
export const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  science: '#0f9fa5',
  geography: '#16a765',
  movies: '#e91e8c',
  music: '#7c3aed',
  history: '#f5a623',
  tech: '#1f6bff',
  any: '#8a85a3',
};
