import type { CSSProperties } from 'react';

// ---- Types ------------------------------------------------------------------

export interface LevelInfo {
  readonly level: number;
  readonly into: number;
  readonly span: number;
  readonly pct: number;
}

export interface RecentGame {
  readonly mode: string;
  readonly score: number;
  readonly total: number;
  readonly at: string;
}

export interface ProfileStats {
  readonly games: number;
  readonly points: number;
  readonly accuracyPct: number;
  readonly recent: ReadonlyArray<RecentGame>;
}

export interface Achievement {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly earned: boolean;
}

export interface AvatarMeta {
  readonly kind: 'none' | 'preset' | 'upload';
  readonly preset: string | null;
}

export interface ProfileViewProps {
  readonly nickname: string;
  readonly level: LevelInfo;
  readonly stats: ProfileStats;
  readonly achievements: ReadonlyArray<Achievement>;
  readonly avatar: AvatarMeta;
  /** Set when kind === 'upload'; URL of the processed webp image. */
  readonly avatarSrc?: string;
  readonly onEditAvatar?: () => void;
}

// ---- Preset colour palette (mirrors server AVATAR_PRESETS) ------------------

const PRESET_COLOR: Record<string, string> = {
  blue: '#1f6bff',
  green: '#16a765',
  pink: '#e91e8c',
  amber: '#f5a623',
  violet: '#7c3aed',
  teal: '#0f9fa5',
};

// ---- Inline SVG icons (no stock emoji, ARC-3) --------------------------------

function CameraIcon(): JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GamepadIcon(): JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}

function StarIcon(): JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TargetIcon(): JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function TrophyIcon({ size = 22 }: { readonly size?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// ---- Sub-components ---------------------------------------------------------

const MODE_LABEL: Record<string, string> = {
  solo: 'Solo',
  duel: 'Duel',
  together: 'Group',
};

interface AvatarCircleProps {
  readonly nickname: string;
  readonly avatar: AvatarMeta;
  readonly avatarSrc?: string;
  readonly size: number;
}

function AvatarCircle(props: AvatarCircleProps): JSX.Element {
  const { nickname, avatar, avatarSrc, size } = props;

  const circleSt: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid var(--card)',
    boxShadow: 'var(--shadow-accent-soft)',
    background:
      avatar.kind === 'preset' && avatar.preset
        ? (PRESET_COLOR[avatar.preset] ?? 'var(--accent)')
        : 'var(--accent)',
    flexShrink: 0,
  };

  if (avatar.kind === 'upload' && avatarSrc) {
    return (
      <div style={circleSt}>
        <img
          src={avatarSrc}
          alt={`${nickname}'s avatar`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  const initial = nickname.charAt(0).toUpperCase();

  return (
    <div style={circleSt}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: `${Math.round(size * 0.4)}px`,
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

interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly icon: JSX.Element;
}

function StatCard(props: StatCardProps): JSX.Element {
  const { label, value, icon } = props;

  const card: CSSProperties = {
    flex: '1 1 0',
    background: 'var(--card)',
    border: '1px solid var(--border-soft)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 10px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <div style={card}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '22px',
          color: 'var(--ink)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--faint)',
          letterSpacing: '0.3px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

interface BadgeProps {
  readonly achievement: Achievement;
}

function Badge(props: BadgeProps): JSX.Element {
  const { achievement } = props;
  const { earned, label, description } = achievement;

  const outer: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    opacity: earned ? 1 : 0.35,
    transition: 'opacity 0.2s',
  };

  const iconRing: CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: earned ? 'var(--accent-soft)' : 'var(--surface-muted)',
    border: `2px solid ${earned ? 'var(--border-accent)' : 'var(--border-soft)'}`,
    color: earned ? 'var(--accent)' : 'var(--faint)',
  };

  return (
    <div style={outer} title={description} aria-label={`${label}${earned ? '' : ' (locked)'}`}>
      <div style={iconRing}>
        <TrophyIcon size={22} />
      </div>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: earned ? 'var(--ink)' : 'var(--faint)',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: '60px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---- Main component ---------------------------------------------------------

/**
 * Presentational profile screen (Phase 1 UI overhaul). Pure props — no fetching.
 * Renders: cover band, avatar + camera button, name/level/XP bar,
 * 3-up stats row, achievements shelf, recent-games list.
 */
export function ProfileView(props: ProfileViewProps): JSX.Element {
  const { nickname, level, stats, achievements, avatar, avatarSrc, onEditAvatar } = props;

  // ---- Styles ----------------------------------------------------------------

  const cover: CSSProperties = {
    height: '110px',
    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)',
    borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
    position: 'relative',
    flexShrink: 0,
  };

  const avatarWrap: CSSProperties = {
    position: 'absolute',
    bottom: '-36px',
    left: '20px',
  };

  const cameraBtn: CSSProperties = {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'var(--accent)',
    border: '2px solid var(--card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: onEditAvatar ? 'pointer' : 'default',
    boxShadow: 'var(--shadow-accent-soft)',
  };

  const body: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 20px 28px',
  };

  const nameRow: CSSProperties = {
    marginTop: '44px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const xpTrack: CSSProperties = {
    height: '6px',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--track)',
    overflow: 'hidden',
    marginTop: '6px',
  };

  const xpFill: CSSProperties = {
    height: '100%',
    borderRadius: 'var(--radius-pill)',
    background: 'var(--accent)',
    width: `${Math.min(100, Math.max(0, level.pct))}%`,
    transition: 'width 0.5s var(--ease)',
  };

  const sectionLabel: CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--faint)',
    letterSpacing: '0.5px',
    margin: '22px 0 10px',
    textTransform: 'uppercase',
  };

  const statsRow: CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '18px',
  };

  const badgeShelf: CSSProperties = {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    scrollbarWidth: 'none',
  };

  const recentCard: CSSProperties = {
    border: '1px solid var(--border-soft)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--card)',
    padding: '11px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: 'var(--shadow-card)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Cover band */}
      <div style={cover}>
        <div style={avatarWrap}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <AvatarCircle nickname={nickname} avatar={avatar} avatarSrc={avatarSrc} size={72} />
            {onEditAvatar ? (
              <button
                type="button"
                style={cameraBtn}
                onClick={onEditAvatar}
                aria-label="Edit avatar"
              >
                <CameraIcon />
              </button>
            ) : (
              <div style={cameraBtn} aria-hidden="true">
                <CameraIcon />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={body}>
        {/* Name + level + XP bar */}
        <div style={nameRow}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '24px',
              margin: 0,
              color: 'var(--ink)',
            }}
          >
            {nickname}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--accent)',
                background: 'var(--accent-soft)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-accent)',
              }}
            >
              Lv {level.level}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--faint)', fontWeight: 600 }}>
              {level.into} / {level.span} XP
            </span>
          </div>
          <div
            style={xpTrack}
            role="progressbar"
            aria-valuenow={level.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="XP progress"
          >
            <div style={xpFill} />
          </div>
        </div>

        {/* 3-up stats row */}
        <div style={statsRow} aria-label="Profile stats">
          <StatCard label="Games" value={stats.games} icon={<GamepadIcon />} />
          <StatCard label="Points" value={stats.points.toLocaleString()} icon={<StarIcon />} />
          <StatCard label="Accuracy" value={`${stats.accuracyPct}%`} icon={<TargetIcon />} />
        </div>

        {/* Achievements shelf */}
        {achievements.length > 0 ? (
          <>
            <p style={sectionLabel}>Achievements</p>
            <div style={badgeShelf} aria-label="Achievements">
              {achievements.map((a) => (
                <Badge key={a.key} achievement={a} />
              ))}
            </div>
          </>
        ) : null}

        {/* Recent games */}
        {stats.recent.length > 0 ? (
          <>
            <p style={sectionLabel}>Recent games</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recent.map((r, i) => (
                <div key={i} style={recentCard}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                    {MODE_LABEL[r.mode] ?? r.mode}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                    {r.score}
                    <span style={{ fontSize: '12px', color: 'var(--score-total)' }}>
                      /{r.total}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
