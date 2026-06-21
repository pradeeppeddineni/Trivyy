import type { CSSProperties } from 'react';
import { avatarUrl } from '../api/client';

// ---- Types ------------------------------------------------------------------

export interface FriendItem {
  readonly id: string;
  readonly nickname: string;
  readonly online: boolean;
  readonly hasStory: boolean;
  readonly avatar: {
    readonly kind: 'none' | 'preset' | 'upload';
    readonly preset: string | null;
  };
}

export interface FriendsBarProps {
  readonly friends: ReadonlyArray<FriendItem>;
  readonly onAddStory: () => void;
  readonly onOpenStory: (friend: FriendItem) => void;
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

// ---- Inline SVG icons -------------------------------------------------------

function PlusIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ---- Sub-components ---------------------------------------------------------

interface AvatarCircleProps {
  readonly friend: FriendItem;
}

function AvatarCircle({ friend }: AvatarCircleProps): JSX.Element {
  const { id, nickname, avatar } = friend;

  const bgColor =
    avatar.kind === 'preset' && avatar.preset
      ? (PRESET_COLOR[avatar.preset] ?? 'var(--accent)')
      : 'var(--accent)';

  const circleSt: CSSProperties = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: bgColor,
    flexShrink: 0,
  };

  if (avatar.kind === 'upload') {
    return (
      <div style={circleSt}>
        <img
          src={avatarUrl(id)}
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
          fontSize: '20px',
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

interface FriendBubbleProps {
  readonly friend: FriendItem;
  readonly onOpenStory: (friend: FriendItem) => void;
}

function FriendBubble({ friend, onOpenStory }: FriendBubbleProps): JSX.Element {
  const { nickname, online, hasStory } = friend;

  const ringWrapSt: CSSProperties = {
    background: hasStory
      ? 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)'
      : 'transparent',
    padding: '3px',
    borderRadius: '50%',
    display: 'inline-flex',
    flexShrink: 0,
    cursor: hasStory ? 'pointer' : 'default',
  };

  const innerWrapSt: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
  };

  const onlineDotSt: CSSProperties = {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--success)',
    border: '2px solid #fff',
  };

  function handleClick(): void {
    if (hasStory) {
      onOpenStory(friend);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div
        data-testid={hasStory ? 'story-ring' : undefined}
        style={ringWrapSt}
        onClick={hasStory ? handleClick : undefined}
        role={hasStory ? 'button' : undefined}
        aria-label={hasStory ? `${nickname}'s story` : nickname}
        tabIndex={hasStory ? 0 : undefined}
        onKeyDown={
          hasStory
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenStory(friend);
                }
              }
            : undefined
        }
      >
        <div style={innerWrapSt}>
          <AvatarCircle friend={friend} />
          {online ? <div data-testid="online-dot" style={onlineDotSt} aria-hidden="true" /> : null}
        </div>
      </div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--body-soft)',
          maxWidth: '56px',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {nickname}
      </span>
    </div>
  );
}

// ---- Main component ---------------------------------------------------------

/**
 * Horizontal story-style friends bar. Purely presentational — no fetching.
 * First item: an add-story "+" button. Remaining items: friend avatars with
 * optional online indicator and gradient story ring.
 */
export function FriendsBar({ friends, onAddStory, onOpenStory }: FriendsBarProps): JSX.Element {
  const barSt: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: '14px',
    overflowX: 'auto',
    padding: '4px 0 8px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none' as CSSProperties['msOverflowStyle'],
  };

  const addBtnSt: CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '2px dashed var(--border-dashed)',
    background: 'var(--surface-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--accent)',
    flexShrink: 0,
  };

  return (
    <div style={barSt}>
      {/* Add-story button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <button type="button" style={addBtnSt} onClick={onAddStory} aria-label="Share your story">
          <PlusIcon />
        </button>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--body-soft)',
            whiteSpace: 'nowrap',
          }}
        >
          Add story
        </span>
      </div>

      {/* Friend bubbles */}
      {friends.map((friend) => (
        <FriendBubble key={friend.id} friend={friend} onOpenStory={onOpenStory} />
      ))}
    </div>
  );
}
