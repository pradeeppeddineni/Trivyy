import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ---- Preset colour palette (mirrors ProfileView) ----------------------------

const PRESET_COLOR: Record<string, string> = {
  blue: '#1f6bff',
  green: '#16a765',
  pink: '#e91e8c',
  amber: '#f5a623',
  violet: '#7c3aed',
  teal: '#0f9fa5',
};

// ---- Types ------------------------------------------------------------------

export interface VSPlayer {
  readonly nickname: string;
  /** Preset key (e.g. 'blue') or null for default accent. */
  readonly avatar: { readonly kind: 'none' | 'preset' | 'upload'; readonly preset: string | null };
  /** URL of an uploaded avatar image, used when kind === 'upload'. */
  readonly avatarSrc?: string;
}

export interface VSIntroProps {
  readonly left: VSPlayer;
  readonly right: VSPlayer;
  /** Called when the player taps START or when autoStartMs elapses. */
  readonly onStart?: () => void;
  /** If set, auto-calls onStart after this many ms (post-animation). */
  readonly autoStartMs?: number;
}

// ---- Avatar circle ----------------------------------------------------------

const CIRCLE_SIZE = 72;

function AvatarCircle({
  player,
  side,
}: {
  readonly player: VSPlayer;
  readonly side: 'left' | 'right';
}): JSX.Element {
  const bg =
    player.avatar.kind === 'preset' && player.avatar.preset
      ? (PRESET_COLOR[player.avatar.preset] ?? 'var(--accent)')
      : 'var(--accent)';

  const circleSt: CSSProperties = {
    width: `${CIRCLE_SIZE}px`,
    height: `${CIRCLE_SIZE}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid rgba(255,255,255,0.25)',
    boxShadow:
      side === 'left' ? '0 8px 20px rgba(31,107,255,0.45)' : '0 8px 20px rgba(229,72,77,0.35)',
    background: bg,
    flexShrink: 0,
  };

  if (player.avatar.kind === 'upload' && player.avatarSrc) {
    return (
      <div style={circleSt} aria-label={`${player.nickname}'s avatar`}>
        <img
          src={player.avatarSrc}
          alt={`${player.nickname}'s avatar`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  const initial = player.nickname.charAt(0).toUpperCase();

  return (
    <div style={circleSt} aria-label={`${player.nickname}'s avatar`}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: `${Math.round(CIRCLE_SIZE * 0.4)}px`,
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

// ---- Lightning bolt SVG (no emoji per ARC-3) --------------------------------

function BoltIcon(): JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// ---- Main component ---------------------------------------------------------

const PANEL: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(160deg, var(--accent) 0%, var(--accent-strong) 55%, #6d1de0 100%)',
  padding: '32px 24px',
  gap: '24px',
  textAlign: 'center',
  minHeight: '380px',
};

/**
 * Animated VS intro panel shown before the first duel question.
 * Left avatar slides in from left, right from right; bolt scales in between.
 * Respects prefers-reduced-motion (instant, no slide).
 * Calls onStart on tap or after autoStartMs.
 */
export function VSIntro(props: VSIntroProps): JSX.Element {
  const { left, right, onStart, autoStartMs } = props;
  const reduce = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoStartMs != null && onStart) {
      timerRef.current = setTimeout(onStart, autoStartMs);
    }
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [autoStartMs, onStart]);

  const leftVariants = reduce
    ? {}
    : { initial: { opacity: 0, x: -48 }, animate: { opacity: 1, x: 0 } };
  const rightVariants = reduce
    ? {}
    : { initial: { opacity: 0, x: 48 }, animate: { opacity: 1, x: 0 } };
  const boltVariants = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.4 },
        animate: { opacity: 1, scale: 1 },
      };

  const avatarTransition = { duration: 0.45, ease: [0.34, 1.42, 0.5, 1] as const };
  const boltTransition = { duration: 0.38, delay: 0.3, ease: [0.34, 1.42, 0.5, 1] as const };

  return (
    <div style={PANEL}>
      {/* ROUND label */}
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '13px',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '2px',
          margin: 0,
          textTransform: 'uppercase',
        }}
      >
        Round 1
      </p>

      {/* Avatars + VS row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {/* Left player */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            flex: 1,
          }}
        >
          <motion.div
            {...(reduce ? {} : { initial: leftVariants.initial, animate: leftVariants.animate })}
            transition={avatarTransition}
          >
            <AvatarCircle player={left} side="left" />
          </motion.div>
          <motion.span
            {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
            transition={{ duration: 0.3, delay: 0.45 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '16px',
              color: '#fff',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {left.nickname}
          </motion.span>
        </div>

        {/* Bolt + VS */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          <motion.div
            {...(reduce ? {} : { initial: boltVariants.initial, animate: boltVariants.animate })}
            transition={boltTransition}
            style={{
              color: '#facc15',
              filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.7))',
              display: 'flex',
            }}
          >
            <BoltIcon />
          </motion.div>
          <motion.span
            {...(reduce
              ? {}
              : { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 } })}
            transition={{ duration: 0.35, delay: 0.35, ease: [0.34, 1.42, 0.5, 1] }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '28px',
              color: '#fff',
              lineHeight: 1,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            VS
          </motion.span>
        </div>

        {/* Right player */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            flex: 1,
          }}
        >
          <motion.div
            {...(reduce ? {} : { initial: rightVariants.initial, animate: rightVariants.animate })}
            transition={avatarTransition}
          >
            <AvatarCircle player={right} side="right" />
          </motion.div>
          <motion.span
            {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
            transition={{ duration: 0.3, delay: 0.45 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '16px',
              color: '#fff',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {right.nickname}
          </motion.span>
        </div>
      </div>

      {/* START button */}
      {onStart ? (
        <button
          type="button"
          onClick={onStart}
          style={{
            marginTop: '8px',
            padding: '14px 40px',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '18px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            letterSpacing: '1px',
          }}
          aria-label="Start the duel"
        >
          START
        </button>
      ) : null}
    </div>
  );
}
