import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Podium, type PodiumEntry } from './Podium';
import { LeaderboardRow } from './LeaderboardRow';
import { Button } from './Button';

// ---- Types ------------------------------------------------------------------

export interface ResultEntry {
  readonly rank: number;
  readonly name: string;
  readonly score: number;
  readonly total: number;
  readonly detail?: string;
  /** Used as the avatar preset color key. */
  readonly avatar?: string;
  readonly avatarSrc?: string;
}

export interface ResultsScreenProps {
  readonly title?: string;
  readonly entries: ReadonlyArray<ResultEntry>;
  /** Rank of the local player (for winner highlighting). */
  readonly meRank?: number;
  readonly onPlayAgain?: () => void;
  readonly onRematch?: () => void;
  readonly playAgainLabel?: string;
}

// ---- Confetti (guarded — never throws in jsdom / test environments) ----------

function fireConfetti(): void {
  // Bail early if canvas API is unavailable (jsdom / SSR).
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Skip under prefers-reduced-motion.
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;

  void import('canvas-confetti')
    .then((mod) => {
      const confetti = mod.default;
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f5a623', '#1f6bff', '#16a765', '#e91e8c', '#7c3aed'],
        });
      } catch {
        // Silently ignore failures (e.g., canvas not available).
      }
    })
    .catch(() => {
      // Dynamic import failure — silently ignore.
    });
}

// ---- Main component ---------------------------------------------------------

/**
 * Celebratory results panel for multiplayer games (group/duel). Shows:
 * - "Congratulations!" heading (or custom title)
 * - Confetti burst on mount (guarded, reduced-motion safe)
 * - Top-3 Podium component
 * - "Leaderboard" sub-heading (required by E2E spec)
 * - Remaining ranked rows via LeaderboardRow
 * - Primary action (Play again / Rematch)
 */
export function ResultsScreen(props: ResultsScreenProps): JSX.Element {
  const {
    title = 'Congratulations!',
    entries,
    meRank,
    onPlayAgain,
    onRematch,
    playAgainLabel = 'Play again',
  } = props;

  const confettiFired = useRef(false);

  useEffect(() => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
  }, []);

  // Top 3 entries → Podium
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const top3: PodiumEntry[] = sorted.slice(0, 3).map((e) => ({
    name: e.name,
    score: e.score,
    total: e.total,
    avatar: e.avatar,
    avatarSrc: e.avatarSrc,
  }));

  const wrap: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 22px 28px',
    gap: '0',
  };

  const headingStyle: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '28px',
    margin: '12px 0 0',
    textAlign: 'center',
    color: 'var(--ink)',
  };

  const subheadingStyle: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '20px',
    margin: '22px 0 10px',
    color: 'var(--ink)',
  };

  const hasAction = Boolean(onPlayAgain ?? onRematch);

  return (
    <main style={wrap}>
      <h2 style={headingStyle}>{title}</h2>

      {top3.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <Podium entries={top3} />
        </div>
      ) : null}

      <h3 style={subheadingStyle}>Leaderboard</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {sorted.map((e) => (
          <LeaderboardRow
            key={`${e.rank}-${e.name}`}
            rank={e.rank}
            name={e.name}
            score={e.score}
            total={e.total}
            detail={e.detail}
            isWinner={meRank != null ? e.rank === meRank && e.rank === 1 : e.rank === 1}
          />
        ))}
      </div>

      {hasAction ? (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {onPlayAgain ? (
            <Button variant="primary" onClick={onPlayAgain}>
              {playAgainLabel}
            </Button>
          ) : null}
          {onRematch ? (
            <Button variant="secondary" onClick={onRematch}>
              Rematch
            </Button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
