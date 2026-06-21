import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import { CategoryTile } from '../components/CategoryTile';
import { Chip } from '../components/Chip';
import { SpinWheel } from '../components/SpinWheel';
import { SETUP_CATEGORIES, CATEGORIES } from '../game/categories';
import { REGIONS } from '../game/regions';
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
  /** Section kicker + CTA label so duel/group reuse the screen with their wording. */
  readonly kicker?: string;
  readonly title?: string;
  readonly ctaLabel?: string;
  /** When provided, shows a "how many players" picker (group "play together"). */
  readonly maxPlayers?: number;
  readonly onMaxPlayers?: (n: number) => void;
  /** When provided, shows a region filter (spec §5.6). */
  readonly region?: string;
  readonly onRegion?: (code: string) => void;
  /** When true, shows a "Spin for it" toggle to use the SpinWheel for category selection. */
  readonly showSpinOption?: boolean;
}

const PLAYER_COUNTS: ReadonlyArray<number> = [2, 3, 4, 5, 6, 8];

/** Color palette for the SpinWheel category segments. */
const CATEGORY_COLORS: ReadonlyArray<string> = [
  '#1f6bff',
  '#16a765',
  '#e91e8c',
  '#f5a623',
  '#7c3aed',
  '#0f9fa5',
];

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
  const {
    categorySlug,
    difficulty,
    count,
    onCategory,
    onDifficulty,
    onCount,
    onStart,
    starting,
    kicker = 'SOLO ROUND',
    title = 'Set up your round',
    ctaLabel = 'Start round →',
    maxPlayers,
    onMaxPlayers,
    region,
    onRegion,
    showSpinOption = false,
  } = props;

  const [showWheel, setShowWheel] = useState(false);

  const wheelSegments = CATEGORIES.map((c, i) => ({
    key: c.slug,
    label: c.label,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] ?? '#1f6bff',
  }));

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
        <p style={KICKER}>{kicker}</p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '28px',
            margin: '4px 0 0',
            color: 'var(--ink)',
          }}
        >
          {title}
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 11px',
        }}
      >
        <p style={{ ...LABEL, margin: 0 }}>CATEGORY</p>
        {showSpinOption ? (
          <button
            type="button"
            onClick={() => setShowWheel((v) => !v)}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent-strong)',
              border: '1.5px solid var(--border-accent)',
              borderRadius: 'var(--radius-pill)',
              background: showWheel ? 'var(--accent-soft)' : 'transparent',
              padding: '4px 12px',
              cursor: 'pointer',
            }}
            aria-pressed={showWheel}
          >
            Spin for it
          </button>
        ) : null}
      </div>

      {showSpinOption && showWheel ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <SpinWheel
            segments={wheelSegments}
            onResult={(key) => {
              onCategory(key);
              setShowWheel(false);
            }}
          />
        </div>
      ) : (
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
      )}

      {onRegion ? (
        <>
          <p style={{ ...LABEL, margin: '22px 0 11px' }}>REGION</p>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            {REGIONS.map((r) => (
              <Chip
                key={r.code}
                label={r.label}
                selected={(region ?? 'any') === r.code}
                onClick={() => onRegion(r.code)}
                flex={false}
              />
            ))}
          </div>
        </>
      ) : null}

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

      {onMaxPlayers ? (
        <>
          <p style={{ ...LABEL, margin: '22px 0 11px' }}>PLAYERS</p>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            {PLAYER_COUNTS.map((n) => (
              <Chip
                key={n}
                label={String(n)}
                selected={maxPlayers === n}
                onClick={() => onMaxPlayers(n)}
              />
            ))}
          </div>
        </>
      ) : null}

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
          {starting ? 'Starting…' : ctaLabel}
        </Button>
      </div>
    </main>
  );
}
