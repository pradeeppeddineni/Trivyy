import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

// ---- Types ------------------------------------------------------------------

export interface PodiumEntry {
  readonly name: string;
  readonly score: number;
  readonly total?: number;
  /** Preset color key (mirrors PRESET_COLOR palette). */
  readonly avatar?: string;
  /** URL of an uploaded avatar image. */
  readonly avatarSrc?: string;
}

export interface PodiumProps {
  /** 1-3 entries in rank order (index 0 = 1st place). */
  readonly entries: ReadonlyArray<PodiumEntry>;
}

// ---- Preset colour palette --------------------------------------------------

const PRESET_COLOR: Record<string, string> = {
  blue: '#1f6bff',
  green: '#16a765',
  pink: '#e91e8c',
  amber: '#f5a623',
  violet: '#7c3aed',
  teal: '#0f9fa5',
};

const DEFAULT_COLORS = ['#1f6bff', '#16a765', '#e91e8c'];

function avatarColor(entry: PodiumEntry, index: number): string {
  if (entry.avatar && PRESET_COLOR[entry.avatar]) {
    return PRESET_COLOR[entry.avatar];
  }
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? '#1f6bff';
}

// ---- Crown SVG (inline, aria-hidden) ----------------------------------------

function CrownIcon(): JSX.Element {
  return (
    <svg
      width="28"
      height="22"
      viewBox="0 0 28 22"
      fill="none"
      aria-hidden="true"
      data-testid="crown-icon"
      style={{ display: 'block', margin: '0 auto 2px' }}
    >
      <path
        d="M2 18L5 8L10 14L14 4L18 14L23 8L26 18H2Z"
        fill="var(--gold)"
        stroke="var(--gold-border)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="4" r="2" fill="var(--gold)" />
      <circle cx="5" cy="8" r="1.5" fill="var(--gold)" />
      <circle cx="23" cy="8" r="1.5" fill="var(--gold)" />
    </svg>
  );
}

// ---- Avatar circle ----------------------------------------------------------

interface AvatarCircleProps {
  readonly entry: PodiumEntry;
  readonly index: number;
  readonly size: number;
}

function AvatarCircle({ entry, index, size }: AvatarCircleProps): JSX.Element {
  const bg = avatarColor(entry, index);
  const style: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid var(--card)',
    boxShadow: '0 4px 12px rgba(31,107,255,0.25)',
    background: bg,
    flexShrink: 0,
  };

  if (entry.avatarSrc) {
    return (
      <div style={style}>
        <img
          src={entry.avatarSrc}
          alt={`${entry.name}'s avatar`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  const initial = entry.name ? entry.name.charAt(0).toUpperCase() : '?';
  const fontSize = Math.round(size * 0.4);

  return (
    <div style={style}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: `${fontSize}px`,
          color: '#fff',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {initial}
      </span>
    </div>
  );
}

// ---- Podium bar -------------------------------------------------------------

interface BarProps {
  readonly height: number;
  readonly color: string;
  readonly rank: number;
  readonly reducedMotion: boolean;
}

function PodiumBar({ height, color, rank, reducedMotion }: BarProps): JSX.Element {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || reducedMotion) return;

    bar.style.transformOrigin = 'bottom';
    bar.style.transform = 'scaleY(0)';
    const raf = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        if (!bar) return;
        bar.style.transition = `transform 0.6s cubic-bezier(0.34, 1.42, 0.5, 1) ${(3 - rank) * 0.08}s`;
        bar.style.transform = 'scaleY(1)';
      });
      return raf2;
    });
    return () => cancelAnimationFrame(raf);
  }, [rank, reducedMotion]);

  return (
    <div
      ref={barRef}
      style={{
        width: '100%',
        height: `${height}px`,
        background: color,
        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
        opacity: 0.9,
      }}
    />
  );
}

// ---- Main component ---------------------------------------------------------

/**
 * Top-3 podium. Accepts 1-3 entries in rank order (index 0 = 1st place).
 * The 1st-place entry is centered and tallest with a crown icon.
 * Bars rise on mount (reduced-motion safe via prefers-reduced-motion).
 */
export function Podium({ entries }: PodiumProps): JSX.Element {
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Slots: [2nd, 1st, 3rd] (visual order — 1st is center, elevated)
  // We place 2nd on the left, 1st in the center, 3rd on the right.
  const first = entries[0] ?? null;
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;

  // Bar heights
  const BAR_1 = 90;
  const BAR_2 = 64;
  const BAR_3 = 48;

  const BAR_COLORS = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];

  const podiumWrap: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 4px 0',
  };

  function SlotColumn(props: {
    entry: PodiumEntry | null;
    rank: number;
    barHeight: number;
    barColor: string;
    avatarSize: number;
    isFirst: boolean;
    entryIndex: number;
  }): JSX.Element {
    const { entry, rank, barHeight, barColor, avatarSize, isFirst, entryIndex } = props;

    if (!entry) {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 0,
          }}
        >
          <div style={{ height: `${avatarSize + 8}px` }} />
          <PodiumBar
            height={barHeight}
            color={barColor}
            rank={rank}
            reducedMotion={reducedMotion}
          />
        </div>
      );
    }

    const scoreText = entry.total != null ? `${entry.score}/${entry.total}` : `${entry.score}`;

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: 0,
        }}
      >
        {isFirst ? <CrownIcon /> : <div style={{ height: '24px' }} />}
        <AvatarCircle entry={entry} index={entryIndex} size={avatarSize} />
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: isFirst ? '15px' : '13px',
            color: 'var(--ink)',
            margin: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
          title={entry.name}
        >
          {entry.name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: isFirst ? '17px' : '14px',
            color: isFirst ? 'var(--gold)' : 'var(--muted)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {scoreText}
        </p>
        <PodiumBar height={barHeight} color={barColor} rank={rank} reducedMotion={reducedMotion} />
      </div>
    );
  }

  return (
    <div style={podiumWrap} aria-label="Podium — top 3 players">
      {/* 2nd place — left */}
      <SlotColumn
        entry={second}
        rank={2}
        barHeight={BAR_2}
        barColor={BAR_COLORS[1]}
        avatarSize={46}
        isFirst={false}
        entryIndex={1}
      />
      {/* 1st place — center, tallest */}
      <SlotColumn
        entry={first}
        rank={1}
        barHeight={BAR_1}
        barColor={BAR_COLORS[0]}
        avatarSize={56}
        isFirst
        entryIndex={0}
      />
      {/* 3rd place — right */}
      <SlotColumn
        entry={third}
        rank={3}
        barHeight={BAR_3}
        barColor={BAR_COLORS[2]}
        avatarSize={46}
        isFirst={false}
        entryIndex={2}
      />
    </div>
  );
}
