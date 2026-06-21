/**
 * HomeHeroScene — premium animated SVG hero for the logged-in Home screen.
 *
 * Entirely presentational; receives callbacks for the three gameplay modes.
 * Uses hand-crafted SVG + CSS only (no raster images, no new npm deps).
 * All animations are suppressed via CSS `prefers-reduced-motion: reduce`.
 *
 * Architecture note: business logic (navigation, auth state) lives in
 * SoloFlow / Home. This component is pure display (ARC-1, ARC-2).
 */

import './HomeHeroScene.css';

export interface HomeHeroSceneProps {
  readonly accountName: string;
  readonly onPlaySolo: () => void;
  readonly onChallenge: () => void;
  readonly onTogether: () => void;
}

// ─── SVG sub-components ───────────────────────────────────────────────────────

/** 3-D glossy medallion with radial depth, specular highlight, inner shadow, and
 *  a central spark emblem. Looks rendered, not flat. */
function HeroEmblem(): JSX.Element {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Outer glow filter */}
        <filter id="hhs-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.31   0 0 0 0 0.61   0 0 0 0 1   0 0 0 0.7 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Main sphere body: deep 3-D radial — amber-orange palette gives
            premium "gold coin" feel distinct from the blue background */}
        <radialGradient id="hhs-sphere" cx="38%" cy="30%" r="75%" fx="38%" fy="30%">
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="18%" stopColor="#ffe484" />
          <stop offset="48%" stopColor="#ffb020" />
          <stop offset="76%" stopColor="#e07800" />
          <stop offset="100%" stopColor="#a04a00" />
        </radialGradient>

        {/* Inner shadow at bottom of sphere */}
        <radialGradient id="hhs-inner-shadow" cx="50%" cy="85%" r="55%" fx="50%" fy="95%">
          <stop offset="0%" stopColor="rgba(80,20,0,0.55)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Specular highlight: bright white near top-left */}
        <radialGradient id="hhs-spec" cx="30%" cy="22%" r="32%" fx="28%" fy="20%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Rim light on the right side (faint cool highlight) */}
        <radialGradient id="hhs-rim" cx="85%" cy="55%" r="30%" fx="90%" fy="55%">
          <stop offset="0%" stopColor="rgba(180,210,255,0.35)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Ring / bezel gradient */}
        <linearGradient id="hhs-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe29a" />
          <stop offset="40%" stopColor="#d4860a" />
          <stop offset="100%" stopColor="#7a4400" />
        </linearGradient>

        {/* Spark / star inner shadow for depth */}
        <filter id="hhs-spark-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(80,30,0,0.5)" />
        </filter>
      </defs>

      {/* Outer glow ring (soft, blurred) */}
      <circle cx="90" cy="90" r="88" fill="rgba(255,176,32,0.18)" filter="url(#hhs-glow)" />

      {/* Bezel / ring stroke */}
      <circle
        cx="90"
        cy="90"
        r="82"
        stroke="url(#hhs-ring)"
        strokeWidth="4"
        fill="none"
        opacity="0.7"
      />

      {/* Main sphere body */}
      <circle cx="90" cy="90" r="80" fill="url(#hhs-sphere)" />

      {/* Inner shadow at bottom */}
      <circle cx="90" cy="90" r="80" fill="url(#hhs-inner-shadow)" />

      {/* Rim light */}
      <circle cx="90" cy="90" r="80" fill="url(#hhs-rim)" />

      {/* Specular highlight (top-left bright spot) */}
      <ellipse cx="63" cy="55" rx="36" ry="28" fill="url(#hhs-spec)" />

      {/* Central Trivyy spark / 6-point star emblem embossed on the sphere */}
      {/* Outer star shape — slightly larger, darker for depth */}
      <path
        d="M90 44 L96 78 L128 72 L104 94 L120 124 L90 106 L60 124 L76 94 L52 72 L84 78 Z"
        fill="rgba(120,50,0,0.22)"
        filter="url(#hhs-spark-shadow)"
        transform="translate(1,2)"
      />
      {/* Main star */}
      <path
        d="M90 44 L96 78 L128 72 L104 94 L120 124 L90 106 L60 124 L76 94 L52 72 L84 78 Z"
        fill="#fff"
        fillOpacity="0.92"
        filter="url(#hhs-spark-shadow)"
      />
      {/* Small inner circle center detail */}
      <circle cx="90" cy="91" r="9" fill="rgba(255,176,32,0.75)" />
      <circle cx="90" cy="91" r="5" fill="rgba(255,255,255,0.6)" />

      {/* Second specular glint (tiny, sharp — "sparkle" on top-left edge) */}
      <ellipse cx="54" cy="44" rx="10" ry="6" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

/** 4-point star sparkle shape */
function Sparkle({ size, color }: { readonly size: number; readonly color: string }): JSX.Element {
  const h = size / 2;
  const q = size / 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <path
        d={`M${h} 0 L${h + q / 2} ${h - q / 2} L${size} ${h} L${h + q / 2} ${h + q / 2} L${h} ${size} L${h - q / 2} ${h + q / 2} L0 ${h} L${h - q / 2} ${h - q / 2} Z`}
        fill={color}
      />
    </svg>
  );
}

/** Question-mark bubble icon */
function QuestionIcon(): JSX.Element {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <text
        x="11"
        y="16"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="rgba(255,255,255,0.9)"
      >
        ?
      </text>
    </svg>
  );
}

/** Lightbulb icon */
function LightbulbIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2a5 5 0 015 5c0 2.1-1.3 3.9-3 4.7V13H8v-1.3C6.3 10.9 5 9.1 5 7a5 5 0 015-5z"
        fill="rgba(255,255,255,0.85)"
      />
      <rect x="7.5" y="13.5" width="5" height="1.5" rx="0.75" fill="rgba(255,255,255,0.7)" />
      <rect x="8" y="15.5" width="4" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

/** Small star icon for third bubble */
function StarIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l2.09 5.26L18 7.27l-4 3.9.94 5.5L10 14 5.06 16.67 6 11.17 2 7.27l5.91-.01L10 2z"
        fill="rgba(255,255,255,0.85)"
      />
    </svg>
  );
}

/** Solo mode icon (play triangle) */
function SoloIcon(): JSX.Element {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Duel mode icon (crossed swords / VS) */
function DuelIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l6 6M5 11l6-6M13 13l6 6M19 13l-6 6" />
    </svg>
  );
}

/** Group mode icon (two people) */
function GroupIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0112 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M14.5 19.5a4.5 4.5 0 019 0" />
    </svg>
  );
}

// ─── Mode chip ────────────────────────────────────────────────────────────────

interface ModeChipProps {
  readonly label: string;
  readonly icon: JSX.Element;
  readonly onClick: () => void;
}

function GlossyModeChip({ label, icon, onClick }: ModeChipProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="hhs-chip"
      style={{
        flex: 1,
        maxWidth: '120px',
        background: 'rgba(255,255,255,0.13)',
        border: '1px solid rgba(255,255,255,0.28)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '7px',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        color: '#fff',
        boxShadow:
          '0 4px 14px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <span
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeHeroScene({
  accountName,
  onPlaySolo,
  onChallenge,
  onTogether,
}: HomeHeroSceneProps): JSX.Element {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 16px 32px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Gradient-mesh background blobs ── */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="hhs-blob hhs-blob-1" />
        <div className="hhs-blob hhs-blob-2" />
        <div className="hhs-blob hhs-blob-3" />
      </div>

      {/* ── Greeting ── */}
      <p
        style={{
          fontSize: '15px',
          fontWeight: 600,
          opacity: 0.88,
          margin: '4px 0 0',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          letterSpacing: '0.1px',
        }}
      >
        Hi, {accountName}
      </p>

      {/* ── Hero stage ── */}
      <div
        style={{
          textAlign: 'center',
          margin: '16px 0 10px',
          position: 'relative',
          zIndex: 1,
          flex: '0 0 auto',
        }}
      >
        {/* Floating accent bubbles (category glyphs) — decorative only */}
        <div aria-hidden="true" className="hhs-bubble hhs-bubble-1">
          <QuestionIcon />
        </div>
        <div aria-hidden="true" className="hhs-bubble hhs-bubble-2">
          <LightbulbIcon />
        </div>
        <div aria-hidden="true" className="hhs-bubble hhs-bubble-3">
          <StarIcon />
        </div>

        {/* Twinkling sparkles — decorative only */}
        <div aria-hidden="true" className="hhs-sparkle hhs-sparkle-1">
          <Sparkle size={12} color="rgba(255,255,255,0.9)" />
        </div>
        <div aria-hidden="true" className="hhs-sparkle hhs-sparkle-2">
          <Sparkle size={10} color="rgba(255,220,80,0.9)" />
        </div>
        <div aria-hidden="true" className="hhs-sparkle hhs-sparkle-3">
          <Sparkle size={8} color="rgba(255,255,255,0.85)" />
        </div>
        <div aria-hidden="true" className="hhs-sparkle hhs-sparkle-4">
          <Sparkle size={10} color="rgba(160,200,255,0.85)" />
        </div>

        {/* 3-D glossy medallion — floats gently, decorative */}
        <div
          aria-hidden="true"
          className="hhs-emblem-wrap"
          style={{ display: 'inline-block', position: 'relative' }}
        >
          <HeroEmblem />
          {/* Shimmer sweep overlay */}
          <div className="hhs-shimmer" />
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '30px',
            fontWeight: 900,
            letterSpacing: '-0.6px',
            margin: '10px 0 2px',
            textShadow: '0 4px 18px rgba(0,0,0,0.3)',
          }}
        >
          Ready to play?
        </h2>
        <p style={{ opacity: 0.8, fontSize: '13px', margin: 0, fontWeight: 500 }}>
          Daily Challenge · 10 questions
        </p>
      </div>

      {/* ── Glossy PLAY button ── */}
      <button
        type="button"
        onClick={onPlaySolo}
        className="hhs-play-btn"
        style={{
          display: 'block',
          width: '80%',
          margin: '20px auto 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #e8f0ff 60%, #d8e6ff 100%)',
          color: '#1657e0',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '17px 0',
          fontSize: '20px',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          letterSpacing: '1.5px',
          /* Layered shadow: cast shadow, glow, top highlight, bottom inner press */
          boxShadow:
            '0 16px 36px -10px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -3px 0 rgba(31,107,255,0.28)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Animated shine sweep */}
        <div className="hhs-play-shine" aria-hidden="true" />
        PLAY
      </button>

      {/* ── Glossy mode chips ── */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <GlossyModeChip label="Solo" onClick={onPlaySolo} icon={<SoloIcon />} />
        <GlossyModeChip label="Duel" onClick={onChallenge} icon={<DuelIcon />} />
        <GlossyModeChip label="Group" onClick={onTogether} icon={<GroupIcon />} />
      </div>
    </main>
  );
}
