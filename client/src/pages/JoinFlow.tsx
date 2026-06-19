import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { Button } from '../components/Button';
import { NicknameInput } from '../components/NicknameInput';
import { DuelFlow } from './DuelFlow';
import { GroupFlow } from './GroupFlow';
import { getStoredNickname, setStoredNickname } from '../lib/nickname';
import { createSession, joinGame, type ApiQuestion } from '../api/client';

export interface JoinFlowProps {
  /** Code lifted from ?join=CODE (may be empty — the player can type it). */
  readonly code?: string;
}

type Joined =
  | {
      readonly mode: 'duel';
      readonly gameId: string;
      readonly questions: ReadonlyArray<ApiQuestion>;
    }
  | { readonly mode: 'together'; readonly gameId: string };

const FIELD: CSSProperties = {
  width: '100%',
  padding: '15px 16px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '3px',
  textTransform: 'uppercase',
  textAlign: 'center',
  color: 'var(--ink)',
  background: 'var(--card)',
};

/**
 * Join landing (spec §5): a player arriving by code or QR enters a nickname,
 * joins, and is handed to the matching mode's flow (duel opponent / group
 * player). The session player is created on submit.
 */
export function JoinFlow(props: JoinFlowProps): JSX.Element {
  const [nickname, setNickname] = useState(getStoredNickname());
  const [code, setCode] = useState((props.code ?? '').toUpperCase());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [joined, setJoined] = useState<Joined | null>(null);

  const goHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const onJoin = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      await createSession(nickname.trim());
      setStoredNickname(nickname.trim());
      const res = await joinGame(code.trim());
      if (res.mode === 'duel') {
        setJoined({ mode: 'duel', gameId: res.gameId, questions: res.questions ?? [] });
      } else {
        setJoined({ mode: 'together', gameId: res.gameId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not join that game.');
    } finally {
      setBusy(false);
    }
  }, [nickname, code]);

  if (joined?.mode === 'duel') {
    return <DuelFlow entry={{ gameId: joined.gameId, questions: joined.questions }} />;
  }
  if (joined?.mode === 'together') {
    return <GroupFlow entry={{ gameId: joined.gameId }} />;
  }

  const canJoin = nickname.trim().length > 0 && code.trim().length === 5;

  return (
    <AppFrame>
      <PlayerHeader onLogoClick={goHome} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 24px 32px' }}>
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '28px',
              margin: 0,
              textAlign: 'center',
              color: 'var(--ink)',
            }}
          >
            Join a game
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--muted)',
              margin: '8px auto 0',
              maxWidth: '280px',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Enter your nickname and the game code your host shared.
          </p>

          <div style={{ marginTop: '24px' }}>
            <NicknameInput value={nickname} onChange={setNickname} />
          </div>

          <div style={{ marginTop: '18px' }}>
            <label
              htmlFor="join-code"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--faint)',
                marginLeft: '4px',
              }}
            >
              GAME CODE
            </label>
            <input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCDE"
              maxLength={5}
              autoCapitalize="characters"
              style={{ ...FIELD, marginTop: '8px' }}
            />
          </div>

          {error ? (
            <p
              role="alert"
              style={{
                fontSize: '13.5px',
                color: 'var(--danger)',
                margin: '12px 0 0 4px',
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          ) : null}

          <div style={{ marginTop: '22px' }}>
            <Button variant="primary" disabled={!canJoin || busy} onClick={() => void onJoin()}>
              {busy ? 'Joining…' : 'Join game'}
            </Button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
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
              ← Back to home
            </button>
          </div>
        </div>
      </main>
    </AppFrame>
  );
}
