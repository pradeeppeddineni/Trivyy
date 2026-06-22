import type { CSSProperties } from 'react';
import { CategoryIcon, CATEGORY_COLORS, normalizeCategorySlug } from './CategoryIcon';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'any';

export interface QuestionCardProps {
  /** Category slug passed to CategoryIcon (replaces the old emoji string). */
  readonly categoryIcon: string;
  readonly categoryLabel: string;
  readonly difficulty: Difficulty;
  readonly question: string;
}

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  any: 'Any',
};

interface DiffStyle {
  readonly bg: string;
  readonly color: string;
}

const DIFF_STYLE: Record<Difficulty, DiffStyle> = {
  easy: { bg: 'rgba(22,167,101,0.22)', color: '#16a765' },
  medium: { bg: 'rgba(245,166,35,0.22)', color: '#d9871f' },
  hard: { bg: 'rgba(229,72,77,0.22)', color: '#e5484d' },
  any: { bg: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)' },
};

/** Premium question card: category-colored gradient header + question text on a clean surface. */
export function QuestionCard(props: QuestionCardProps): JSX.Element {
  const { categoryIcon, categoryLabel, difficulty, question } = props;

  const accentColor = CATEGORY_COLORS[normalizeCategorySlug(categoryIcon)] ?? '#1f6bff';
  const diffStyle = DIFF_STYLE[difficulty];

  const card: CSSProperties = {
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    boxShadow: `0 2px 6px rgba(0,0,0,0.06), 0 8px 24px ${accentColor}22`,
    background: 'var(--card)',
  };

  const header: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor}99 100%)`,
  };

  const categoryRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
  };

  const categoryLabel_style: CSSProperties = {
    fontWeight: 700,
    fontSize: '13.5px',
    letterSpacing: '0.2px',
    color: '#fff',
  };

  const diffPill: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 'var(--radius-pill)',
    fontSize: '11.5px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    background: diffStyle.bg,
    color: diffStyle.color,
    border: `1px solid ${diffStyle.color}55`,
    backdropFilter: 'blur(4px)',
  };

  const body: CSSProperties = {
    padding: '20px 18px 22px',
  };

  const questionStyle: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: 1.3,
    margin: 0,
    color: 'var(--ink-deep)',
    ...({ textWrap: 'pretty' } as CSSProperties),
  };

  return (
    <div style={card}>
      <div style={header}>
        <div style={categoryRow}>
          <CategoryIcon slug={categoryIcon} size={20} />
          <span style={categoryLabel_style}>{categoryLabel}</span>
        </div>
        <span style={diffPill}>{DIFF_LABEL[difficulty]}</span>
      </div>
      <div style={body}>
        <h2 style={questionStyle}>{question}</h2>
      </div>
    </div>
  );
}
