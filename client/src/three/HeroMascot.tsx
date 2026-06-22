/**
 * HeroMascot — wrapper that gates the WebGL chunk.
 *
 * - Detects: prefers-reduced-motion, no WebGL, SSR.
 * - If any condition is true → renders StaticFallback immediately (CSS gradient
 *   + inline SVG mascot medallion). No 3-D chunk loaded.
 * - Otherwise → React.lazy(Scene) inside Suspense (StaticFallback as placeholder
 *   while the chunk downloads).
 *
 * Props:
 *   size?    — pixel dimension of the square canvas (defaults 220 hero / 120 compact)
 *   variant? — 'hero' (default) | 'compact'
 *
 * The Canvas always has pointer-events: none so it never blocks UI.
 * Scene.tsx and Mascot.tsx are EXCLUDED from jsdom unit-test coverage
 * (they require WebGL). This file IS unit-tested: in jsdom the fallback renders.
 */

import { lazy, Suspense } from 'react';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface HeroMascotProps {
  readonly size?: number;
  readonly variant?: 'hero' | 'compact';
}

// ── WebGL + environment detection ─────────────────────────────────────────────

function hasWebGL(): boolean {
  // SSR guard
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function shouldUse3D(): boolean {
  return hasWebGL() && !prefersReducedMotion();
}

// ── Lazy 3-D chunk (only loaded when shouldUse3D() is true) ──────────────────

const LazyScene = lazy(() => import('./Scene'));

// ── Static fallback ───────────────────────────────────────────────────────────

interface FallbackProps {
  readonly size?: number;
  readonly variant?: 'hero' | 'compact';
}

/**
 * StaticFallback — CSS gradient ring + inline SVG mascot face.
 * Shown when WebGL unavailable or reduced-motion requested.
 * Also used as the Suspense placeholder while the 3-D chunk loads.
 */
export function StaticFallback({ size, variant = 'hero' }: FallbackProps): JSX.Element {
  const dim = size ?? (variant === 'compact' ? 120 : 220);
  const cx = dim / 2;
  const bodyR = dim * 0.34;
  const eyeR = dim * 0.07;
  const eyeY = cx - dim * 0.04;
  const eyeXOff = dim * 0.12;
  const antennaX = cx;
  const antennaTopY = cx - bodyR - dim * 0.22;
  const antennaBottomY = cx - bodyR;
  const sparkR = dim * 0.045;

  return (
    <div
      aria-label="Trivyy mascot"
      role="img"
      style={{
        width: dim,
        height: dim,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        pointerEvents: 'none',
      }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        aria-hidden="true"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="hm-body" cx="38%" cy="30%" r="75%" fx="38%" fy="30%">
            <stop offset="0%" stopColor="#6fb3ff" />
            <stop offset="45%" stopColor="#1f6bff" />
            <stop offset="100%" stopColor="#0d3db8" />
          </radialGradient>
          <radialGradient id="hm-spec" cx="30%" cy="22%" r="32%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="hm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(31,107,255,0.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Soft outer glow */}
        <circle cx={cx} cy={cx} r={bodyR * 1.3} fill="url(#hm-glow)" />

        {/* Body */}
        <circle cx={cx} cy={cx} r={bodyR} fill="url(#hm-body)" />

        {/* Specular highlight */}
        <ellipse
          cx={cx - bodyR * 0.28}
          cy={cx - bodyR * 0.32}
          rx={bodyR * 0.4}
          ry={bodyR * 0.28}
          fill="url(#hm-spec)"
        />

        {/* Eyes */}
        <circle cx={cx - eyeXOff} cy={eyeY} r={eyeR} fill="#fff" />
        <circle cx={cx + eyeXOff} cy={eyeY} r={eyeR} fill="#fff" />
        {/* Pupils */}
        <circle cx={cx - eyeXOff} cy={eyeY} r={eyeR * 0.5} fill={PUPIL} />
        <circle cx={cx + eyeXOff} cy={eyeY} r={eyeR * 0.5} fill={PUPIL} />
        {/* Glints */}
        <circle cx={cx - eyeXOff + eyeR * 0.3} cy={eyeY - eyeR * 0.3} r={eyeR * 0.18} fill="#fff" />
        <circle cx={cx + eyeXOff + eyeR * 0.3} cy={eyeY - eyeR * 0.3} r={eyeR * 0.18} fill="#fff" />

        {/* Antenna stem */}
        <line
          x1={antennaX}
          y1={antennaTopY + sparkR}
          x2={antennaX}
          y2={antennaBottomY}
          stroke="#4f9dff"
          strokeWidth={dim * 0.022}
          strokeLinecap="round"
        />
        {/* Spark orb */}
        <circle cx={antennaX} cy={antennaTopY} r={sparkR} fill="#f5a623" />
        <circle
          cx={antennaX - sparkR * 0.3}
          cy={antennaTopY - sparkR * 0.3}
          r={sparkR * 0.35}
          fill="rgba(255,255,255,0.7)"
        />
      </svg>
    </div>
  );
}

const PUPIL = '#2b264a';

// ── Public wrapper ────────────────────────────────────────────────────────────

/**
 * HeroMascot — the only component that pages import.
 * Lazy-loads Scene.tsx (WebGL chunk) when the environment supports it.
 */
export function HeroMascot({ size, variant = 'hero' }: HeroMascotProps): JSX.Element {
  if (!shouldUse3D()) {
    return <StaticFallback size={size} variant={variant} />;
  }

  return (
    <Suspense fallback={<StaticFallback size={size} variant={variant} />}>
      <LazyScene size={size} variant={variant} />
    </Suspense>
  );
}
