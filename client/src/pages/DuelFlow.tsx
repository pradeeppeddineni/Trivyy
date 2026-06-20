import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { GameCodeCard } from '../components/GameCodeCard';
import { QRCard } from '../components/QRCard';
import { InviteActions } from '../components/InviteActions';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { Button } from '../components/Button';
import { Setup } from './Setup';
import { NicknamePrompt } from './NicknamePrompt';
import { RoundPlayer } from './RoundPlayer';
import { getStoredNickname, setStoredNickname } from '../lib/nickname';
import { usePolling } from '../api/usePolling';
import {
  createSession,
  createDuelGame,
  getDuelResult,
  type ApiQuestion,
  type Difficulty,
  type DuelResultResponse,
} from '../api/client';

export interface DuelFlowProps {
  /** Present when this player joined an existing duel as the opponent. */
  readonly entry?: { readonly gameId: string; readonly questions: ReadonlyArray<ApiQuestion> };
}

type Screen = 'nickname' | 'setup' | 'playing' | 'waiting' | 'result' | 'error';

function joinUrl(code: string): string {
  return `${window.location.origin}/?join=${code}`;
}

/**
 * Async duel flow (spec §4.2). The creator picks a set, plays first, then shares
 * a code/QR while the waiting screen polls for the opponent's result. The
 * opponent enters via `entry` (from the join landing) and plays the same set.
 */
export function DuelFlow(props: DuelFlowProps): JSX.Element {
  const isCreator = !props.entry;
  const stored = getStoredNickname();

  const [screen, setScreen] = useState<Screen>(
    isCreator ? (stored ? 'setup' : 'nickname') : 'playing',
  );
  const [nickname, setNickname] = useState(stored);
  const [categorySlug, setCategorySlug] = useState('any');
  const [difficulty, setDifficulty] = useState<Difficulty>('any');
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [gameId, setGameId] = useState(props.entry?.gameId ?? '');
  const [questions, setQuestions] = useState<ReadonlyArray<ApiQuestion>>(
    props.entry?.questions ?? [],
  );
  const [code, setCode] = useState('');
  const [result, setResult] = useState<DuelResultResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const goHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const goError = useCallback((message: string) => {
    setErrorMessage(message);
    setScreen('error');
  }, []);

  const onCreate = useCallback(async () => {
    setStarting(true);
    try {
      await createSession(nickname.trim());
      const created = await createDuelGame({
        count,
        categorySlug: categorySlug === 'any' ? undefined : categorySlug,
        difficulty,
      });
      setGameId(created.gameId);
      setCode(created.code);
      setQuestions(created.questions);
      setScreen('playing');
    } catch {
      goError('We could not create your challenge. Please try again.');
    } finally {
      setStarting(false);
    }
  }, [nickname, count, categorySlug, difficulty, goError]);

  // Poll the head-to-head result while waiting for the other player to finish.
  usePolling(
    async () => {
      const r = await getDuelResult(gameId);
      if (r.status === 'complete') {
        setResult(r);
        setScreen('result');
      }
    },
    { enabled: screen === 'waiting' && gameId !== '' },
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
            title="Challenge a friend"
            subtitle="Pick a nickname, then choose your topic. You play first, then share a code."
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
            kicker="CHALLENGE A FRIEND"
            title="Set up the duel"
            ctaLabel="Create challenge →"
            categorySlug={categorySlug}
            difficulty={difficulty}
            count={count}
            onCategory={setCategorySlug}
            onDifficulty={setDifficulty}
            onCount={setCount}
            onStart={() => void onCreate()}
            starting={starting}
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
            onComplete={() => setScreen('waiting')}
            onError={goError}
            onQuit={goHome}
          />
        );
      case 'waiting':
        return <WaitingScreen code={isCreator ? code : null} />;
      case 'result':
        if (!result) {
          return <StatusScreen title="Loading…" />;
        }
        return <DuelResult result={result} onHome={goHome} />;
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

const CENTER: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '24px',
  gap: '18px',
};

/** Share-and-wait screen: the creator shows the code + QR; both poll the result. */
function WaitingScreen(props: { code: string | null }): JSX.Element {
  return (
    <main style={CENTER}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '24px',
          margin: 0,
          color: 'var(--ink)',
        }}
      >
        {props.code ? 'Challenge ready!' : 'Waiting for the result…'}
      </h2>
      {props.code ? (
        <>
          <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0, maxWidth: '300px' }}>
            Share this code (or the QR) with your friend. We&apos;ll show the result the moment they
            finish.
          </p>
          <GameCodeCard code={props.code} label="GAME CODE">
            <QRCard value={joinUrl(props.code)} />
          </GameCodeCard>
          <InviteActions url={joinUrl(props.code)} code={props.code} />
        </>
      ) : (
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0, maxWidth: '300px' }}>
          You&apos;re done! Waiting for the other player to finish…
        </p>
      )}
      <div style={{ fontSize: '13px', color: 'var(--faint)' }}>Checking for updates…</div>
    </main>
  );
}

/** Head-to-head result from the requesting player's perspective. */
function DuelResult(props: { result: DuelResultResponse; onHome: () => void }): JSX.Element {
  const { result, onHome } = props;
  const youScore = result.you.score ?? 0;
  const oppScore = result.opponent?.score ?? 0;
  const youWon = result.outcome === 'win';
  const draw = result.outcome === 'draw';
  const headline = draw ? "It's a draw!" : youWon ? 'You win! 🏆' : 'You lost';

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 22px 28px' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '30px',
          margin: '14px 0 18px',
          textAlign: 'center',
          color: 'var(--ink)',
        }}
      >
        {headline}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <LeaderboardRow
          rank={youWon || draw ? 1 : 2}
          name={`${result.you.nickname} (you)`}
          score={youScore}
          total={result.total}
          isWinner={youWon || draw}
        />
        {result.opponent ? (
          <LeaderboardRow
            rank={!youWon || draw ? 1 : 2}
            name={result.opponent.nickname}
            score={oppScore}
            total={result.total}
            isWinner={!youWon || draw}
          />
        ) : null}
      </div>
      <div style={{ marginTop: '24px' }}>
        <Button variant="primary" onClick={onHome}>
          Back to home
        </Button>
      </div>
    </main>
  );
}
