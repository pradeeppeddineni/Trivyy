import type { CSSProperties } from 'react';

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
  readonly badgeBg: string;
  readonly badgeColor: string;
  readonly badge?: string;
}

const THEMES: Record<AnswerState, PillTheme> = {
  idle: {
    cardBorder: '2px solid var(--border)',
    cardBg: 'var(--card)',
    cardColor: 'var(--ink)',
    badgeBg: 'var(--accent-tint)',
    badgeColor: 'var(--accent)',
  },
  selected: {
    cardBorder: '2px solid var(--accent)',
    cardBg: 'var(--accent-soft)',
    cardColor: 'var(--accent-strong)',
    badgeBg: 'var(--accent)',
    badgeColor: '#fff',
  },
  correct: {
    cardBorder: '2px solid var(--success-strong)',
    cardBg: 'var(--success-tint)',
    cardColor: 'var(--success-ink)',
    badgeBg: 'var(--success-strong)',
    badgeColor: '#fff',
    badge: '✓',
  },
  incorrect: {
    cardBorder: '2px solid var(--danger-soft)',
    cardBg: 'var(--danger-tint)',
    cardColor: 'var(--danger-ink)',
    badgeBg: 'var(--danger-soft)',
    badgeColor: '#fff',
    badge: '✕',
  },
};

/** Answer choice button with idle / selected / correct / incorrect states. */
export function AnswerPill(props: AnswerPillProps): JSX.Element {
  const { index, text, state = 'idle', dimmed = false, onClick } = props;
  const theme = THEMES[state];
  const badge = theme.badge ?? String.fromCharCode(65 + index);

  const card: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    width: '100%',
    padding: '15px 16px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.18s',
    fontFamily: 'inherit',
    border: theme.cardBorder,
    background: theme.cardBg,
    color: theme.cardColor,
    opacity: dimmed ? 0.5 : 1,
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
    transition: 'all 0.18s',
    background: dimmed ? 'var(--accent-tint)' : theme.badgeBg,
    color: dimmed ? 'var(--faint-soft)' : theme.badgeColor,
  };

  return (
    <button type="button" onClick={onClick} style={card}>
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
