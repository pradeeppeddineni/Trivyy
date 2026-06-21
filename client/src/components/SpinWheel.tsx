import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';

// ---- Types ------------------------------------------------------------------

export interface WheelSegment {
  readonly key: string;
  readonly label: string;
  /** CSS color string for the wedge background. */
  readonly color: string;
}

export interface SpinWheelProps {
  readonly segments: ReadonlyArray<WheelSegment>;
  readonly onResult: (key: string) => void;
  /** Force the landing segment index (0-based) — used in tests for determinism. */
  readonly pickIndex?: number;
}

// ---- Helpers ----------------------------------------------------------------

/** Build a conic-gradient string for N equal wedges. */
function buildConicGradient(segments: ReadonlyArray<WheelSegment>): string {
  const n = segments.length;
  if (n === 0) return 'none';
  const step = 360 / n;
  return (
    'conic-gradient(' +
    segments.map((seg, i) => `${seg.color} ${i * step}deg ${(i + 1) * step}deg`).join(', ') +
    ')'
  );
}

// ---- Component --------------------------------------------------------------

const WHEEL_SIZE = 260;
const SPIN_DURATION_MS = 3200;
const EASE_TIMING = `${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 1.0)`;

/**
 * Spin-the-wheel category picker. Renders N equal conic-gradient wedges with
 * a pointer, SPIN button, and a landing animation. Deterministic via pickIndex.
 * Reduced-motion: snaps immediately to the result.
 */
export function SpinWheel(props: SpinWheelProps): JSX.Element {
  const { segments, onResult, pickIndex } = props;
  const reduce = useReducedMotion();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const baseRotationRef = useRef(0);

  const handleSpin = useCallback(() => {
    if (spinning || segments.length === 0) return;

    const n = segments.length;
    const step = 360 / n;

    // Choose landing segment — deterministic if pickIndex provided, random otherwise.
    const landingIndex =
      pickIndex != null ? ((pickIndex % n) + n) % n : Math.floor(Math.random() * n);

    // We want that segment to sit at the top (pointer).
    // Segment i occupies [i*step, (i+1)*step) from 0°.
    // Mid-point of that segment on the original wheel: (i + 0.5) * step.
    // For it to appear at the top after clockwise rotation of R:
    //   (midpoint - R) mod 360 = 0  =>  R = midpoint mod 360.
    const landingMid = (landingIndex + 0.5) * step;

    // Add enough full turns + fine adjustment so the spin feels real.
    const fullTurns = reduce ? 0 : 5;
    const targetRotation = baseRotationRef.current + fullTurns * 360 + landingMid;

    if (reduce) {
      // Snap immediately: apply rotation without transition, call result.
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `perspective(800px) rotateX(8deg) rotate(${targetRotation}deg)`;
      }
      baseRotationRef.current = targetRotation;
      setRotation(targetRotation);
      onResult(segments[landingIndex]!.key);
      return;
    }

    setSpinning(true);
    setRotation(targetRotation);

    if (wheelRef.current) {
      wheelRef.current.style.transition = EASE_TIMING;
      wheelRef.current.style.transform = `perspective(800px) rotateX(8deg) rotate(${targetRotation}deg)`;
    }

    setTimeout(() => {
      baseRotationRef.current = targetRotation;
      setSpinning(false);
      onResult(segments[landingIndex]!.key);
    }, SPIN_DURATION_MS + 50);
  }, [spinning, segments, pickIndex, reduce, onResult]);

  const gradient = buildConicGradient(segments);
  const n = segments.length;
  const step = 360 / n;

  const containerSt: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    userSelect: 'none',
  };

  const pointerWrapSt: CSSProperties = {
    position: 'relative',
    width: `${WHEEL_SIZE}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  // Subtle 3D tilt on the container via perspective + rotateX.
  const wheelSt: CSSProperties = {
    width: `${WHEEL_SIZE}px`,
    height: `${WHEEL_SIZE}px`,
    borderRadius: '50%',
    background: gradient,
    position: 'relative',
    transform: `perspective(800px) rotateX(8deg) rotate(${rotation}deg)`,
    boxShadow: '0 12px 32px rgba(31,107,255,0.25), 0 4px 10px rgba(0,0,0,0.1)',
    willChange: 'transform',
  };

  return (
    <div style={containerSt} aria-label="Spin the wheel">
      <div style={pointerWrapSt}>
        {/* Pointer (downward-pointing triangle) at the top */}
        <div
          aria-hidden="true"
          style={{
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '18px solid var(--ink)',
            marginBottom: '4px',
            zIndex: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
          }}
        />

        {/* Wheel */}
        <div ref={wheelRef} style={wheelSt} aria-hidden="true">
          {/* Segment labels */}
          {segments.map((seg, i) => {
            const angleDeg = (i + 0.5) * step;
            const angleRad = ((angleDeg - 90) * Math.PI) / 180;
            const radius = WHEEL_SIZE * 0.32;
            const x = WHEEL_SIZE / 2 + radius * Math.cos(angleRad);
            const y = WHEEL_SIZE / 2 + radius * Math.sin(angleRad);

            return (
              <span
                key={seg.key}
                aria-label={seg.label}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '11px',
                  color: '#fff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  maxWidth: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}
              >
                {seg.label}
              </span>
            );
          })}

          {/* Centre hub */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--card)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>

      {/* SPIN button */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={spinning}
        aria-label="Spin the wheel"
        style={{
          padding: '13px 36px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          background: spinning ? 'var(--faint-soft)' : 'var(--accent)',
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '17px',
          cursor: spinning ? 'not-allowed' : 'pointer',
          boxShadow: spinning ? 'none' : 'var(--shadow-accent)',
          transition: 'background 0.2s, box-shadow 0.2s',
          letterSpacing: '0.5px',
        }}
      >
        {spinning ? 'Spinning…' : 'SPIN'}
      </button>

      {/* Invisible segment list for accessibility / tests */}
      <ul
        aria-label="Category segments"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          width: 0,
          height: 0,
          overflow: 'hidden',
        }}
      >
        {segments.map((seg) => (
          <li key={seg.key}>{seg.label}</li>
        ))}
      </ul>
    </div>
  );
}
