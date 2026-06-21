import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { Button } from '../components/Button';
import { InviteActions } from '../components/InviteActions';
import {
  authMe,
  listGroups,
  createGroupClub,
  joinGroupClub,
  getGroupDetail,
  getGroupStandings,
  type Account,
  type Group,
  type GroupDetail,
  type GroupStanding,
} from '../api/client';

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
  padding: '13px 14px',
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

export interface GroupsFlowProps {
  /** From ?gjoin=CODE — auto-join this group on load when signed in. */
  readonly autoJoinCode?: string;
}

/** Persistent groups (spec v3 §13.3): list, create, join, detail + standings + play. */
export function GroupsFlow(props: GroupsFlowProps = {}): JSX.Element {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ReadonlyArray<Group>>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState<string | undefined>(undefined);

  const refresh = useCallback(async () => {
    setGroups(await listGroups());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const acc = await authMe();
        if (!active) return;
        setAccount(acc);
        if (acc) {
          if (props.autoJoinCode) {
            try {
              await joinGroupClub(props.autoJoinCode);
              setMessage('Joined the group.');
            } catch {
              setMessage('That group invite is no longer valid.');
            }
          }
          try {
            await refresh();
          } catch {
            setMessage('Could not load your groups.');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh, props.autoJoinCode]);

  const onCreate = async (): Promise<void> => {
    if (!name.trim()) return;
    try {
      await createGroupClub(name.trim());
      setName('');
      await refresh();
    } catch {
      setMessage('Could not create the group.');
    }
  };

  const onJoin = async (): Promise<void> => {
    try {
      await joinGroupClub(joinCode.trim());
      setJoinCode('');
      await refresh();
      setMessage('Joined.');
    } catch {
      setMessage('Could not join — check the code.');
    }
  };

  if (loading) {
    return (
      <AppFrame>
        <StatusScreen title="Loading groups…" />
      </AppFrame>
    );
  }

  if (!account) {
    return (
      <AppFrame>
        <PlayerHeader onLogoClick={goHome} />
        <StatusScreen
          title="Sign in for groups"
          message="Create a group, invite friends, and track standings across rematches."
          actionLabel="Sign in / sign up"
          onAction={() => {
            window.location.search = '?account';
          }}
        />
      </AppFrame>
    );
  }

  if (openId) {
    return <GroupDetailView groupId={openId} onBack={() => setOpenId(null)} />;
  }

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
            Groups
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

        <p style={SECTION}>YOUR GROUPS</p>
        {groups.length === 0 ? (
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
            No groups yet — create one below.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setOpenId(g.id)}
                style={{
                  ...CARD,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                  {g.name}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                  {g.memberCount} member{g.memberCount === 1 ? '' : 's'} →
                </span>
              </button>
            ))}
          </div>
        )}

        <p style={SECTION}>CREATE A GROUP</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            aria-label="Group name"
            style={INPUT}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            maxLength={40}
          />
          <Button variant="primary" fullWidth={false} onClick={() => void onCreate()}>
            Create
          </Button>
        </div>

        <p style={SECTION}>JOIN BY CODE</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            aria-label="Group code"
            style={INPUT}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABCDE"
            maxLength={5}
            autoCapitalize="characters"
          />
          <Button variant="secondary" fullWidth={false} onClick={() => void onJoin()}>
            Join
          </Button>
        </div>
      </main>
    </AppFrame>
  );
}

function GroupDetailView(props: { groupId: string; onBack: () => void }): JSX.Element {
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [standings, setStandings] = useState<ReadonlyArray<GroupStanding>>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getGroupDetail(props.groupId), getGroupStandings(props.groupId)])
      .then(([d, s]) => {
        if (!active) return;
        setDetail(d);
        setStandings(s);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [props.groupId]);

  if (error) {
    return (
      <AppFrame>
        <StatusScreen
          title="Could not load the group"
          tone="error"
          actionLabel="Back"
          onAction={props.onBack}
        />
      </AppFrame>
    );
  }
  if (!detail) {
    return (
      <AppFrame>
        <StatusScreen title="Loading…" />
      </AppFrame>
    );
  }

  const joinUrl = `${window.location.origin}/?gjoin=${detail.code}`;
  const play = (): void => {
    window.location.search = `?group&for=${detail.id}`;
  };

  return (
    <AppFrame>
      <PlayerHeader nickname={detail.name} onLogoClick={() => (window.location.href = '/')} />
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
              fontSize: '24px',
              margin: '8px 0',
              color: 'var(--ink)',
            }}
          >
            {detail.name}
          </h1>
          <button
            type="button"
            onClick={props.onBack}
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

        <div style={{ marginTop: '8px' }}>
          <Button variant="primary" onClick={play}>
            Play a round with this group →
          </Button>
        </div>

        <p style={SECTION}>INVITE</p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '-4px 0 10px' }}>
          Share the code <strong>{detail.code}</strong> or this link to add members.
        </p>
        <InviteActions url={joinUrl} code={detail.code} />

        <p style={SECTION}>MEMBERS ({detail.members.length})</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {detail.members.map((m) => (
            <div key={m.username ?? m.nickname} style={CARD}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                {m.nickname} {m.isOwner ? '· owner' : ''}
              </span>
            </div>
          ))}
        </div>

        <p style={SECTION}>STANDINGS</p>
        <p style={{ fontSize: '12.5px', color: 'var(--faint)', margin: '-4px 0 10px' }}>
          Cumulative points across this group&apos;s games.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {standings.map((e) => {
            const top = e.rank === 1 && e.points > 0;
            return (
              <div
                key={`${e.rank}-${e.nickname}`}
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
                    {e.nickname} {top ? '🥇' : ''}
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
