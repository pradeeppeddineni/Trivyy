import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { Button } from '../components/Button';
import { InviteActions } from '../components/InviteActions';
import {
  authMe,
  listFriends,
  listFriendRequests,
  searchPlayers,
  sendFriendRequest,
  respondFriendRequest,
  acceptFriendInvite,
  getFriendsLeaderboard,
  type Account,
  type PlayerSummary,
  type FriendRequest,
  type FriendLeaderboardEntry,
} from '../api/client';

export interface FriendsFlowProps {
  /** Invite code from ?friend=CODE — auto-accepted on load when signed in. */
  readonly inviteCode?: string;
}

const SECTION: CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.5px',
  margin: '22px 0 10px',
};

const CARD: CSSProperties = {
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--card)',
  padding: '12px 13px',
};

const INPUT: CSSProperties = {
  flex: 1,
  padding: '11px 13px',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--ink)',
  background: 'var(--card)',
};

function goHome(): void {
  window.location.href = '/';
}

function rowName(p: PlayerSummary): string {
  return p.nickname && p.nickname !== p.username
    ? `${p.nickname} (@${p.username})`
    : `@${p.username}`;
}

/**
 * Friends (spec v3 §13.2): invite link, username search + requests, friends
 * list, and the cumulative-points friends leaderboard. Requires an account.
 */
export function FriendsFlow(props: FriendsFlowProps): JSX.Element {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<ReadonlyArray<PlayerSummary>>([]);
  const [requests, setRequests] = useState<ReadonlyArray<FriendRequest>>([]);
  const [board, setBoard] = useState<ReadonlyArray<FriendLeaderboardEntry>>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReadonlyArray<PlayerSummary>>([]);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    const [f, r, b] = await Promise.all([
      listFriends(),
      listFriendRequests(),
      getFriendsLeaderboard(),
    ]);
    setFriends(f);
    setRequests(r);
    setBoard(b);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const acc = await authMe();
        if (!active) return;
        setAccount(acc);
        if (acc) {
          if (props.inviteCode) {
            try {
              await acceptFriendInvite(props.inviteCode);
            } catch {
              setMessage('That invite link is no longer valid.');
            }
          }
          await refresh();
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [props.inviteCode, refresh]);

  const onSearch = useCallback(async () => {
    setMessage(undefined);
    try {
      setResults(await searchPlayers(query));
    } catch {
      setResults([]);
    }
  }, [query]);

  const onAdd = async (username: string): Promise<void> => {
    try {
      const { status } = await sendFriendRequest(username);
      setMessage(status === 'accepted' ? 'Already friends.' : 'Request sent.');
      setResults([]);
      setQuery('');
      await refresh();
    } catch {
      setMessage('Could not send the request.');
    }
  };

  const onRespond = async (id: string, accept: boolean): Promise<void> => {
    try {
      await respondFriendRequest(id, accept);
      await refresh();
    } catch {
      setMessage('Could not update the request.');
    }
  };

  if (loading) {
    return (
      <AppFrame>
        <StatusScreen title="Loading friends…" />
      </AppFrame>
    );
  }

  if (!account) {
    return (
      <AppFrame>
        <PlayerHeader onLogoClick={goHome} />
        <StatusScreen
          title="Sign in for friends"
          message="Friends, invites, and the friends leaderboard need an account."
          actionLabel="Sign in / sign up"
          onAction={() => {
            window.location.search = '?account';
          }}
        />
      </AppFrame>
    );
  }

  const inviteUrl = `${window.location.origin}/?friend=${account.inviteCode}`;

  return (
    <AppFrame>
      <PlayerHeader nickname={account.nickname} onLogoClick={goHome} />
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 20px 28px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '26px',
              margin: '8px 0',
              color: 'var(--ink)',
            }}
          >
            Friends
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
            ← Back
          </button>
        </div>

        {message ? (
          <p
            role="status"
            style={{
              fontSize: '13.5px',
              color: 'var(--accent-strong)',
              margin: '4px 0 0',
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        ) : null}

        <p style={SECTION}>YOUR INVITE LINK</p>
        <InviteActions url={inviteUrl} code={account.inviteCode} />

        <p style={SECTION}>ADD A FRIEND</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            aria-label="Search by username"
            style={INPUT}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            autoCapitalize="none"
          />
          <Button variant="secondary" fullWidth={false} onClick={() => void onSearch()}>
            Search
          </Button>
        </div>
        {results.length > 0 ? (
          <div
            style={{
              ...CARD,
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {results.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600 }}>
                  {rowName(p)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onClick={() => void onAdd(p.username)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {requests.length > 0 ? (
          <>
            <p style={SECTION}>REQUESTS ({requests.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    ...CARD,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600 }}>
                    {rowName(r.from)}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth={false}
                      onClick={() => void onRespond(r.id, true)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth={false}
                      onClick={() => void onRespond(r.id, false)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <p style={SECTION}>FRIENDS ({friends.length})</p>
        {friends.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
            No friends yet — share your invite link.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.map((p) => (
              <div key={p.id} style={CARD}>
                <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600 }}>
                  {rowName(p)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={SECTION}>LEADERBOARD</p>
        <p style={{ fontSize: '12.5px', color: 'var(--faint)', margin: '-4px 0 10px' }}>
          Cumulative points (correct answers) across all games.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {board.map((e) => {
            const top = e.rank === 1 && e.points > 0;
            return (
              <div
                key={`${e.rank}-${e.username}`}
                style={{
                  ...CARD,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: top ? '2px solid var(--success-strong)' : '1px solid var(--border-soft)',
                  background: top ? 'var(--winner-tint)' : 'var(--card)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '17px',
                    width: '22px',
                    textAlign: 'center',
                    color: 'var(--faint-soft)',
                  }}
                >
                  {e.rank}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                    {e.isMe ? `${e.nickname} (you)` : e.nickname}{' '}
                    {e.rank === 1 && e.points > 0 ? '🥇' : ''}
                  </p>
                  <p
                    style={{
                      margin: '1px 0 0',
                      fontSize: '12.5px',
                      color: 'var(--faint)',
                      fontWeight: 600,
                    }}
                  >
                    {e.games} game{e.games === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '22px',
                    color: 'var(--accent)',
                  }}
                >
                  {e.points}
                  <span style={{ fontSize: '13px', color: 'var(--score-total)' }}> pts</span>
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </AppFrame>
  );
}
