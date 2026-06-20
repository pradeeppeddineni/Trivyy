import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { GameCodeCard } from '../components/GameCodeCard';
import { QRCard } from '../components/QRCard';
import { PlayerRow, type PlayerRowStatus } from '../components/PlayerRow';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { InviteActions } from '../components/InviteActions';
import { Button } from '../components/Button';
import { Setup } from './Setup';
import { NicknamePrompt } from './NicknamePrompt';
import { RoundPlayer } from './RoundPlayer';
import { getStoredNickname, setStoredNickname } from '../lib/nickname';
import { usePolling } from '../api/usePolling';
import {
  createSession,
  createGroupGame,
  getQuestions,
  startGroup,
  getLobby,
  getLeaderboard,
  type ApiQuestion,
  type Difficulty,
  type LobbyResponse,
  type LeaderboardResponse,
} from '../api/client';

export interface GroupFlowProps {
  /** Present when this player joined an existing lobby (not the host). */
  readonly entry?: { readonly gameId: string };
}

type Screen = 'nickname' | 'setup' | 'lobby' | 'playing' | 'leaderboard' | 'error';

function joinUrl(code: string): string {
  return `${window.location.origin}/?join=${code}`;
}

function rowStatus(status: string): PlayerRowStatus {
  if (status === 'done') return 'done';
  if (status === 'playing') return 'playing';
  return 'ready';
}

/**
 * Group "play together" flow (spec §4.4). The host sets up a round and opens a
 * lobby (code + QR); joiners wait there. When the host starts, everyone plays
 * the same set and lands on a polled leaderboard.
 */
export function GroupFlow(props: GroupFlowProps): JSX.Element {
  const isHost = !props.entry;
  const stored = getStoredNickname();

  const [screen, setScreen] = useState<Screen>(isHost ? (stored ? 'setup' : 'nickname') : 'lobby');
  const [nickname, setNickname] = useState(stored);
  const [categorySlug, setCategorySlug] = useState('any');
  const [difficulty, setDifficulty] = useState<Difficulty>('any');
  const [count, setCount] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [starting, setStarting] = useState(false);
  const [gameId, setGameId] = useState(props.entry?.gameId ?? '');
  const [questions, setQuestions] = useState<ReadonlyArray<ApiQuestion>>([]);
  const [lobby, setLobby] = useState<LobbyResponse | null>(null);
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const goHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const goError = useCallback((message: string) => {
    setErrorMessage(message);
    setScreen('error');
  }, []);

  const beginPlaying = useCallback(async () => {
    try {
      const qs = await getQuestions(gameId);
      setQuestions(qs);
      setScreen('playing');
    } catch {
      goError('We could not load the questions. Please try again.');
    }
  }, [gameId, goError]);

  const onCreate = useCallback(async () => {
    setStarting(true);
    try {
      await createSession(nickname.trim());
      const created = await createGroupGame({
        count,
        categorySlug: categorySlug === 'any' ? undefined : categorySlug,
        difficulty,
        maxPlayers,
      });
      setGameId(created.gameId);
      setScreen('lobby');
    } catch {
      goError('We could not create the lobby. Please try again.');
    } finally {
      setStarting(false);
    }
  }, [nickname, count, categorySlug, difficulty, maxPlayers, goError]);

  const onStartGame = useCallback(async () => {
    setStarting(true);
    try {
      await startGroup(gameId);
      await beginPlaying();
    } catch {
      goError('We could not start the game. Please try again.');
    } finally {
      setStarting(false);
    }
  }, [gameId, beginPlaying, goError]);

  // Lobby polling: refresh the roster; a joiner advances to play once the host
  // starts (status flips to in_progress).
  usePolling(
    async () => {
      const snapshot = await getLobby(gameId);
      setLobby(snapshot);
      if (!isHost && snapshot.status === 'in_progress') {
        await beginPlaying();
      }
    },
    { enabled: screen === 'lobby' && gameId !== '' },
  );

  // Leaderboard polling: keep ranking live until everyone is done.
  usePolling(
    async () => {
      setBoard(await getLeaderboard(gameId));
    },
    { enabled: screen === 'leaderboard' && gameId !== '' && board?.status !== 'complete' },
  );

  return (
    <AppFrame>
      <PlayerHeader nickname={nickname.trim() || undefined} onLogoClick={goHome} />
      {render()}
    </AppFrame>
  );

  function render(): JSX.Element {
    switch (screen) {
      case 'nickname':
        return (
          <NicknamePrompt
            title="Play together"
            subtitle="Pick a nickname and a topic, then invite players to your lobby."
            initial={nickname}
            cta="Continue"
            onSubmit={(name) => {
              setNickname(name);
              setStoredNickname(name);
              setScreen('setup');
            }}
            onBack={goHome}
          />
        );
      case 'setup':
        return (
          <Setup
            kicker="PLAY TOGETHER"
            title="Set up the game"
            ctaLabel="Create lobby →"
            categorySlug={categorySlug}
            difficulty={difficulty}
            count={count}
            maxPlayers={maxPlayers}
            onMaxPlayers={setMaxPlayers}
            onCategory={setCategorySlug}
            onDifficulty={setDifficulty}
            onCount={setCount}
            onStart={() => void onCreate()}
            starting={starting}
          />
        );
      case 'lobby':
        return (
          <LobbyScreen
            lobby={lobby}
            isHost={isHost}
            nickname={nickname.trim()}
            starting={starting}
            onStart={() => void onStartGame()}
          />
        );
      case 'playing':
        if (questions.length === 0) {
          return <StatusScreen title="Loading…" />;
        }
        return (
          <RoundPlayer
            gameId={gameId}
            questions={questions}
            onComplete={() => setScreen('leaderboard')}
            onError={goError}
            onQuit={goHome}
          />
        );
      case 'leaderboard':
        return <LeaderboardScreen board={board} nickname={nickname.trim()} onHome={goHome} />;
      case 'error':
        return (
          <StatusScreen
            title="Something went wrong"
            message={errorMessage}
            tone="error"
            actionLabel="Back to home"
            onAction={goHome}
          />
        );
      default:
        return <StatusScreen title="Loading…" />;
    }
  }
}

const PAD: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '10px 22px 26px',
};

function LobbyScreen(props: {
  lobby: LobbyResponse | null;
  isHost: boolean;
  nickname: string;
  starting: boolean;
  onStart: () => void;
}): JSX.Element {
  const { lobby, isHost, nickname, starting, onStart } = props;
  if (!lobby) {
    return <StatusScreen title="Opening the lobby…" />;
  }
  return (
    <main style={PAD}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '24px',
          margin: '6px 0 14px',
          textAlign: 'center',
          color: 'var(--ink)',
        }}
      >
        Game lobby
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GameCodeCard code={lobby.code} label="GAME CODE">
          <QRCard value={joinUrl(lobby.code)} />
        </GameCodeCard>
      </div>

      <div style={{ marginTop: '16px' }}>
        <InviteActions url={joinUrl(lobby.code)} code={lobby.code} />
      </div>

      <p
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--faint)',
          letterSpacing: '0.5px',
          margin: '20px 0 10px',
        }}
      >
        PLAYERS ({lobby.players.length}
        {lobby.maxPlayers ? ` / ${lobby.maxPlayers}` : ''})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {lobby.players.map((p) => (
          <PlayerRow
            key={p.nickname}
            name={p.nickname}
            isYou={p.nickname === nickname}
            status={rowStatus(p.status)}
            statusText={p.isHost ? 'Host' : p.status === 'done' ? 'Finished' : 'Ready'}
            scoreText={p.status === 'done' ? `${p.score}` : undefined}
          />
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '22px' }}>
        {isHost ? (
          <Button variant="primary" disabled={starting} onClick={onStart}>
            {starting ? 'Starting…' : 'Start game'}
          </Button>
        ) : (
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            Waiting for the host to start…
          </p>
        )}
      </div>
    </main>
  );
}

function LeaderboardScreen(props: {
  board: LeaderboardResponse | null;
  nickname: string;
  onHome: () => void;
}): JSX.Element {
  const { board, nickname, onHome } = props;
  if (!board) {
    return <StatusScreen title="Tallying scores…" />;
  }
  const done = board.status === 'complete';
  return (
    <main style={PAD}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '26px',
          margin: '10px 0 4px',
          textAlign: 'center',
          color: 'var(--ink)',
        }}
      >
        Leaderboard
      </h2>
      <p
        style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' }}
      >
        {done ? 'Final standings' : 'Live — players still finishing…'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {board.entries.map((e) => (
          <LeaderboardRow
            key={e.nickname}
            rank={e.rank}
            name={e.nickname === nickname ? `${e.nickname} (you)` : e.nickname}
            score={e.score}
            total={e.total}
            detail={e.done ? undefined : 'playing…'}
            isWinner={done && e.rank === 1}
          />
        ))}
      </div>
      <div style={{ marginTop: '24px' }}>
        <Button variant="primary" onClick={onHome}>
          Back to home
        </Button>
      </div>
    </main>
  );
}
