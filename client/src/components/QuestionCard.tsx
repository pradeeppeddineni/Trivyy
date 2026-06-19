import type { CSSProperties } from 'react';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'any';

export interface QuestionCardProps {
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

const DIFF_PILL: Record<Difficulty, CSSProperties> = {
  easy: { background: 'var(--success-soft)', color: 'var(--success)' },
  medium: {
    background: 'var(--warning-tint-2)',
    color: 'var(--warning-ink-soft)',
  },
  hard: { background: 'var(--danger-bg)', color: 'var(--danger)' },
  any: { background: 'var(--card-tint)', color: 'var(--body-soft)' },
};

const PILL_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12.5px',
  fontWeight: 700,
  padding: '6px 12px',
  borderRadius: 'var(--radius-pill)',
};

/** Category + difficulty pills above the question prompt shown during play. */
export function QuestionCard(props: QuestionCardProps): JSX.Element {
  const { categoryIcon, categoryLabel, difficulty, question } = props;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <span
          style={{
            ...PILL_BASE,
            color: 'var(--body-soft)',
            background: 'var(--card-tint)',
          }}
        >
          {categoryIcon} {categoryLabel}
        </span>
        <span style={{ ...PILL_BASE, ...DIFF_PILL[difficulty] }}>{DIFF_LABEL[difficulty]}</span>
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '27px',
          lineHeight: 1.28,
          margin: '18px 0 24px',
          color: 'var(--ink-deep)',
          ...({ textWrap: 'pretty' } as CSSProperties),
        }}
      >
        {question}
      </h2>
    </div>
  );
}
