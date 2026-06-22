import { type CSSProperties, useEffect, useState } from 'react';

export type AnswerState = 'idle' | 'selected' | 'correct' | 'incorrect';

export interface AnswerPillProps {
  /** Zero-based index used to derive the A/B/C/D badge. */
  readonly index: number;
  readonly text: string;
  readonly state?: AnswerState;
  /** Dims the pill when another answer is the focus after grading. */
  readonly dimmed?: boolean;
  readonly onClick?: () => void;
}

interface PillTheme {
  readonly cardBorder: string;
  readonly cardBg: string;
  readonly cardColor: string;
  readonly cardShadow: string;
  readonly badgeBg: string;
  readonly badgeColor: string;
  readonly badgeShadow?: string;
  readonly badge?: string;
}

const THEMES: Record<AnswerState, PillTheme> = {
  idle: {
    cardBorder: '2px solid var(--border)',
    cardBg: 'var(--card)',
    cardColor: 'var(--ink)',
    cardShadow: 'var(--shadow-card)',
    badgeBg: 'var(--accent-tint)',
    badgeColor: 'var(--accent)',
  },
  selected: {
    cardBorder: '2px solid var(--accent)',
    cardBg: 'var(--accent-soft)',
    cardColor: 'var(--accent-strong)',
    cardShadow: '0 4px 14px rgba(31,107,255,0.18)',
    badgeBg: 'var(--accent)',
    badgeColor: '#fff',
    badgeShadow: '0 2px 6px rgba(31,107,255,0.35)',
  },
  correct: {
    cardBorder: '2px solid var(--success-strong)',
    cardBg: 'var(--success-tint)',
    cardColor: 'var(--success-ink)',
    cardShadow: '0 4px 14px rgba(22,192,121,0.18)',
    badgeBg: 'var(--success-strong)',
    badgeColor: '#fff',
    badgeShadow: '0 2px 6px rgba(22,192,121,0.35)',
    badge: '✓',
  },
  incorrect: {
    cardBorder: '2px solid var(--danger-soft)',
    cardBg: 'var(--danger-tint)',
    cardColor: 'var(--danger-ink)',
    cardShadow: '0 4px 14px rgba(229,72,77,0.14)',
    badgeBg: 'var(--danger-soft)',
    badgeColor: '#fff',
    badgeShadow: '0 2px 6px rgba(229,72,77,0.3)',
    badge: '✕',
  },
};

function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/** Answer choice button with idle / selected / correct / incorrect states. */
export function AnswerPill(props: AnswerPillProps): JSX.Element {
  const { index, text, state = 'idle', dimmed = false, onClick } = props;
  const theme = THEMES[state];
  const badge = theme.badge ?? String.fromCharCode(65 + index);
  const reducedMotion = useReducedMotionPref();

  let animation: string | undefined;
  if (!reducedMotion) {
    if (state === 'correct') animation = 'okpulse 0.7s ease-out';
    else if (state === 'incorrect') animation = 'shake 0.45s ease-out';
  }

  const card: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    width: '100%',
    padding: '14px 16px',
    borderRadius: 'var(--radius-lg)',
    cursor: onClick ? 'pointer' : 'default',
    textAlign: 'left',
    transition: 'box-shadow 0.18s, border-color 0.18s, background 0.18s, opacity 0.18s',
    fontFamily: 'inherit',
    border: theme.cardBorder,
    background: theme.cardBg,
    color: theme.cardColor,
    boxShadow: dimmed ? 'none' : theme.cardShadow,
    opacity: dimmed ? 0.48 : 1,
    animation,
    /* Gloss overlay via pseudo-element is not possible in inline styles,
       so we approximate with a subtle inset gradient on the background. */
    backgroundImage:
      state === 'idle' || state === 'selected'
        ? 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)'
        : undefined,
  };

  const letter: CSSProperties = {
    flex: 'none',
    width: '34px',
    height: '34px',
    borderRadius: 'var(--radius-sm)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: '15px',
    transition: 'background 0.18s, box-shadow 0.18s',
    background: dimmed ? 'var(--accent-tint)' : theme.badgeBg,
    color: dimmed ? 'var(--faint-soft)' : theme.badgeColor,
    boxShadow: dimmed ? 'none' : (theme.badgeShadow ?? 'none'),
  };

  return (
    <button type="button" onClick={onClick} style={card} data-answer-state={state}>
      <span style={letter}>{badge}</span>
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: '16.5px',
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        {text}
      </span>
    </button>
  );
}
