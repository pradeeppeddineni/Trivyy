import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { CategoryTile } from '../components/CategoryTile';
import { Chip } from '../components/Chip';
import { SETUP_CATEGORIES } from '../game/categories';
import type { Difficulty } from '../api/client';

export interface SetupProps {
  readonly categorySlug: string;
  readonly difficulty: Difficulty;
  readonly count: number;
  readonly onCategory: (slug: string) => void;
  readonly onDifficulty: (difficulty: Difficulty) => void;
  readonly onCount: (count: number) => void;
  readonly onStart: () => void;
  readonly starting: boolean;
}

const KICKER: CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--accent)',
  letterSpacing: '1px',
  margin: 0,
};

const LABEL: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.4px',
};

const DIFFICULTIES: ReadonlyArray<{ id: Difficulty; label: string }> = [
  { id: 'any', label: 'Any' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

const COUNTS: ReadonlyArray<number> = [5, 10, 15];

function summaryText(categorySlug: string, difficulty: Difficulty, count: number): string {
  const cat = SETUP_CATEGORIES.find((c) => c.slug === categorySlug);
  const catLabel = categorySlug === 'any' ? 'mixed topics' : (cat?.label ?? categorySlug);
  const diffLabel = difficulty === 'any' ? 'mixed-difficulty' : difficulty;
  return `${count} ${diffLabel} questions on ${catLabel}.`;
}

/** Setup screen: category tiles, difficulty + count chips, summary, Start. */
export function Setup(props: SetupProps): JSX.Element {
  const { categorySlug, difficulty, count, onCategory, onDifficulty, onCount, onStart, starting } =
    props;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 22px 26px',
        overflowY: 'auto',
      }}
    >
      <div style={{ margin: '6px 0 18px' }}>
        <p style={KICKER}>SOLO ROUND</p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '28px',
            margin: '4px 0 0',
            color: 'var(--ink)',
          }}
        >
          Set up your round
        </h2>
      </div>

      <p style={{ ...LABEL, margin: '0 0 11px' }}>CATEGORY</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
        {SETUP_CATEGORIES.map((c) => (
          <CategoryTile
            key={c.slug}
            icon={c.icon}
            label={c.label}
            selected={categorySlug === c.slug}
            onClick={() => onCategory(c.slug)}
          />
        ))}
      </div>

      <p style={{ ...LABEL, margin: '22px 0 11px' }}>DIFFICULTY</p>
      <div style={{ display: 'flex', gap: '9px' }}>
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d.id}
            label={d.label}
            selected={difficulty === d.id}
            onClick={() => onDifficulty(d.id)}
          />
        ))}
      </div>

      <p style={{ ...LABEL, margin: '22px 0 11px' }}>QUESTIONS</p>
      <div style={{ display: 'flex', gap: '9px' }}>
        {COUNTS.map((n) => (
          <Chip key={n} label={String(n)} selected={count === n} onClick={() => onCount(n)} />
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <div
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--border-accent-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '13px 16px',
            marginBottom: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: 'var(--body-soft)',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {summaryText(categorySlug, difficulty, count)}
          </span>
        </div>
        <Button variant="primary" onClick={onStart} disabled={starting}>
          {starting ? 'Starting…' : 'Start round →'}
        </Button>
      </div>
    </main>
  );
}
