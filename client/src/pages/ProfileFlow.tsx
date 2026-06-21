import { useCallback, useEffect, useRef, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { AvatarPicker } from '../components/AvatarPicker';
import type { AvatarPresetKey } from '../components/AvatarPicker';
import { ProfileView } from '../components/ProfileView';
import { getMyStats, uploadAvatar, setAvatarPreset, type ProfileStats } from '../api/client';

function goHome(): void {
  window.location.href = '/';
}

/** Fetch the session nickname from /api/me (returns null when no session). */
async function fetchNickname(): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch('/api/me', { credentials: 'include' });
  } catch {
    throw new Error('Network error — please try again.');
  }
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = (await res.json()) as { nickname: string };
  return data.nickname;
}

// ---- Modal overlay for the avatar picker ------------------------------------

interface PickerModalProps {
  readonly activePreset: AvatarPresetKey | null;
  readonly onPickPreset: (key: AvatarPresetKey) => void;
  readonly onUploadFile: (file: File) => void;
  readonly onClose: () => void;
}

function PickerModal(props: PickerModalProps): JSX.Element {
  const { activePreset, onPickPreset, onUploadFile, onClose } = props;

  const overlay = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(35,31,59,0.6)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 100,
  };

  const sheet = {
    width: '100%',
    maxWidth: 'var(--app-width)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
    padding: '20px 20px 32px',
    boxShadow: 'var(--shadow-toast)',
  };

  return (
    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Edit avatar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={sheet}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '20px',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Edit avatar
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '22px',
              color: 'var(--faint)',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>
        <AvatarPicker
          activePreset={activePreset}
          onPickPreset={onPickPreset}
          onUploadFile={onUploadFile}
        />
      </div>
    </div>
  );
}

// ---- Main flow --------------------------------------------------------------

/**
 * Profile screen — fetches /api/me + /api/me/stats in parallel and renders
 * <ProfileView>. The camera button opens <AvatarPicker>; on preset/upload the
 * API is called then stats are refetched. Handles loading/error states.
 */
export function ProfileFlow(): JSX.Element {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const activeRef = useRef(true);

  const fetchAll = useCallback((): void => {
    Promise.all([getMyStats(), fetchNickname()])
      .then(([s, nick]) => {
        if (!activeRef.current) return;
        if (!s || !nick) {
          setLoadState('none');
          return;
        }
        setStats(s);
        setNickname(nick);
        setLoadState('ready');
      })
      .catch(() => {
        if (activeRef.current) setLoadState('error');
      });
  }, []);

  useEffect(() => {
    activeRef.current = true;
    fetchAll();
    return () => {
      activeRef.current = false;
    };
  }, [fetchAll]);

  const handlePickPreset = useCallback(
    (key: AvatarPresetKey): void => {
      setSaving(true);
      setSaveError(null);
      setAvatarPreset(key)
        .then(() => {
          setPickerOpen(false);
          fetchAll();
        })
        .catch((err: unknown) => {
          setSaveError(err instanceof Error ? err.message : 'Could not save avatar.');
        })
        .finally(() => {
          setSaving(false);
        });
    },
    [fetchAll],
  );

  const handleUploadFile = useCallback(
    (file: File): void => {
      setSaving(true);
      setSaveError(null);
      uploadAvatar(file)
        .then(() => {
          setPickerOpen(false);
          fetchAll();
        })
        .catch((err: unknown) => {
          setSaveError(err instanceof Error ? err.message : 'Could not upload avatar.');
        })
        .finally(() => {
          setSaving(false);
        });
    },
    [fetchAll],
  );

  // ---- Loading / error states ------------------------------------------------

  if (loadState === 'loading') {
    return (
      <AppFrame>
        <StatusScreen title="Loading your profile…" />
      </AppFrame>
    );
  }

  if (loadState === 'none') {
    return (
      <AppFrame>
        <PlayerHeader onLogoClick={goHome} />
        <StatusScreen
          title="No stats yet"
          message="Play a game and your profile will appear here."
          actionLabel="Play"
          onAction={goHome}
        />
      </AppFrame>
    );
  }

  if (loadState === 'error' || !stats || !nickname) {
    return (
      <AppFrame>
        <StatusScreen
          title="Could not load your profile"
          tone="error"
          actionLabel="Back"
          onAction={goHome}
        />
      </AppFrame>
    );
  }

  // ---- Active preset for the picker (derived from stats) ---------------------

  const activePreset: AvatarPresetKey | null =
    stats.avatar.kind === 'preset' && stats.avatar.preset
      ? (stats.avatar.preset as AvatarPresetKey)
      : null;

  return (
    <AppFrame>
      <PlayerHeader nickname={nickname} onLogoClick={goHome} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 0',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '20px',
            margin: 0,
            color: 'var(--ink)',
          }}
        >
          My Profile
        </h1>
        <button
          type="button"
          onClick={goHome}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: 'var(--accent-strong)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Back
        </button>
      </div>

      {saveError ? (
        <p
          style={{
            margin: '8px 20px 0',
            fontSize: '13px',
            color: 'var(--danger)',
            fontWeight: 600,
          }}
          role="alert"
        >
          {saveError}
        </p>
      ) : null}

      {saving ? (
        <p
          style={{
            margin: '8px 20px 0',
            fontSize: '13px',
            color: 'var(--faint)',
            fontWeight: 600,
          }}
          aria-live="polite"
        >
          Saving…
        </p>
      ) : null}

      <ProfileView
        nickname={nickname}
        level={stats.level}
        stats={{
          games: stats.games,
          points: stats.points,
          accuracyPct: stats.accuracyPct,
          recent: stats.recent,
        }}
        achievements={stats.achievements}
        avatar={stats.avatar}
        onEditAvatar={() => setPickerOpen(true)}
      />

      {pickerOpen ? (
        <PickerModal
          activePreset={activePreset}
          onPickPreset={handlePickPreset}
          onUploadFile={handleUploadFile}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </AppFrame>
  );
}
