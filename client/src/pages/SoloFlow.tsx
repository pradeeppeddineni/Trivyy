import { useCallback, useEffect, useRef, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { Toast } from '../components/Toast';
import { FriendsBar } from '../components/FriendsBar';
import { StoryViewer } from '../components/StoryViewer';
import { ShareBadgeSheet } from '../components/ShareBadgeSheet';
import { Home } from './Home';
import { Setup } from './Setup';
import { setStoredNickname } from '../lib/nickname';
import { Gameplay, type GradeState } from './Gameplay';
import { SoloResults } from './SoloResults';
import {
  createSession,
  createSoloGame,
  submitAnswer,
  completeGame,
  getResult,
  authMe,
  listFriends,
  listFriendStories,
  pingPresence,
  postStory,
  getMyStats,
  type ApiQuestion,
  type Difficulty,
  type ResultResponse,
  type FriendSummary,
  type FriendStory,
} from '../api/client';
import type { FriendItem } from '../components/FriendsBar';

/** The screens the solo flow moves through (the state machine). */
type Screen = 'home' | 'setup' | 'loading' | 'game' | 'completing' | 'results' | 'error';

interface GameState {
  readonly gameId: string;
  readonly questions: ReadonlyArray<ApiQuestion>;
  readonly index: number;
  readonly score: number;
  readonly grade: GradeState | null;
}

const HEADER_SCREENS: ReadonlyArray<Screen> = ['home', 'setup', 'results'];

/**
 * Solo game flow controller (design source of truth). Owns the screen state
 * machine and the API calls; the child screens are presentational. Every screen
 * has loading / empty / error / success states (ARC-4).
 */
export function SoloFlow(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('home');
  const [nickname, setNickname] = useState('');
  const [categorySlug, setCategorySlug] = useState('any');
  const [difficulty, setDifficulty] = useState<Difficulty>('any');
  const [region, setRegion] = useState('any');
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  // --- Social state (Phase 2) -------------------------------------------------
  const [friends, setFriends] = useState<ReadonlyArray<FriendSummary>>([]);
  const [openStory, setOpenStory] = useState<FriendStory | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [earnedAchievements, setEarnedAchievements] = useState<
    ReadonlyArray<{ key: string; label: string; description: string }>
  >([]);

  // Reflect a signed-in account on the home screen (guest play needs no account).
  useEffect(() => {
    let active = true;
    authMe()
      .then((acc) => {
        if (active && acc) {
          setAccountName(acc.nickname);
          setNickname((prev) => prev || acc.nickname);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Fetch friends list for the friends bar (Phase 2). Silently hides on 401/error.
  useEffect(() => {
    if (!accountName) return;
    let active = true;
    listFriends()
      .then((list) => {
        if (active) setFriends(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [accountName]);

  // Presence ping every 60 s while mounted (Phase 2). Only for registered players.
  useEffect(() => {
    if (!accountName) return;
    void pingPresence();
    const id = window.setInterval(() => void pingPresence(), 60_000);
    return () => window.clearInterval(id);
  }, [accountName]);

  // Fetch earned achievements for the share sheet (Phase 2).
  useEffect(() => {
    if (!accountName) return;
    let active = true;
    getMyStats()
      .then((stats) => {
        if (!active || !stats) return;
        const earned = stats.achievements
          .filter((a) => a.earned)
          .map((a) => ({ key: a.key, label: a.label, description: a.description }));
        setEarnedAchievements(earned);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [accountName]);

  const handleOpenStory = useCallback((friend: FriendItem) => {
    // Find the first active story for this friend from a fresh fetch.
    listFriendStories()
      .then((stories) => {
        const story = stories.find((s) => s.playerId === friend.id) ?? null;
        if (story) setOpenStory(story);
      })
      .catch(() => undefined);
  }, []);

  const handleShareBadge = useCallback(async (badge: { label: string; detail: string }) => {
    try {
      await postStory({ label: badge.label, detail: badge.detail });
      setShowShareSheet(false);
      // Refresh friends list so story ring appears immediately.
      listFriends()
        .then((list) => setFriends(list))
        .catch(() => undefined);
    } catch {
      // Non-fatal: share failure silently ignored.
    }
  }, []);

  const flashToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  // Persist the nickname, then hand off to another mode via query-param routing
  // (a full reload, so in-memory state is dropped — see lib/nickname).
  const goToMode = useCallback(
    (target: string) => {
      if (nickname.trim()) {
        setStoredNickname(nickname.trim());
      }
      window.location.search = target;
    },
    [nickname],
  );

  const goError = useCallback((message: string) => {
    setErrorMessage(message);
    setScreen('error');
  }, []);

  const onPlaySolo = useCallback(() => {
    if (!nickname.trim()) {
      flashToast('Pick a nickname first');
      return;
    }
    setScreen('setup');
  }, [nickname, flashToast]);

  const onStart = useCallback(async () => {
    setStarting(true);
    try {
      await createSession(nickname.trim());
      const created = await createSoloGame({
        count,
        categorySlug: categorySlug === 'any' ? undefined : categorySlug,
        difficulty,
        region: region === 'any' ? undefined : region,
      });
      if (created.questions.length === 0) {
        setScreen('setup');
        flashToast('No questions match those filters');
        return;
      }
      setGame({
        gameId: created.gameId,
        questions: created.questions,
        index: 0,
        score: 0,
        grade: null,
      });
      setScreen('game');
    } catch {
      goError('We could not start your game. Please try again.');
    } finally {
      setStarting(false);
    }
  }, [nickname, count, categorySlug, difficulty, region, flashToast, goError]);

  // When the current question was shown, for response-time stats (OBS-3).
  const shownAt = useRef<number>(performance.now());
  useEffect(() => {
    shownAt.current = performance.now();
  }, [game?.index, screen]);

  const onSelect = useCallback(
    async (choice: string) => {
      if (!game || game.grade) {
        return;
      }
      setSubmitting(true);
      try {
        const current = game.questions[game.index];
        const elapsedMs = Math.round(performance.now() - shownAt.current);
        const graded = await submitAnswer(game.gameId, current.id, choice, elapsedMs);
        setGame((prev) =>
          prev
            ? {
                ...prev,
                grade: {
                  selected: choice,
                  correct: graded.correct,
                  correctAnswer: graded.correctAnswer,
                },
                score: prev.score + (graded.correct ? 1 : 0),
              }
            : prev,
        );
      } catch {
        goError('We could not record your answer. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [game, goError],
  );

  const finish = useCallback(
    async (gameId: string) => {
      setScreen('completing');
      try {
        await completeGame(gameId);
        const finalResult = await getResult(gameId);
        setResult(finalResult);
        setScreen('results');
      } catch {
        goError('We could not load your results. Please try again.');
      }
    },
    [goError],
  );

  const onNext = useCallback(() => {
    if (!game) {
      return;
    }
    const isLast = game.index + 1 >= game.questions.length;
    if (isLast) {
      void finish(game.gameId);
      return;
    }
    setGame((prev) => (prev ? { ...prev, index: prev.index + 1, grade: null } : prev));
  }, [game, finish]);

  const onQuit = useCallback(() => {
    setGame(null);
    setScreen('home');
  }, []);

  const onPlayAgain = useCallback(() => {
    setResult(null);
    setGame(null);
    setScreen('setup');
  }, []);

  const showHeader = HEADER_SCREENS.includes(screen);

  return (
    <AppFrame>
      {showHeader ? (
        <PlayerHeader nickname={nickname.trim() || undefined} onLogoClick={onQuit} />
      ) : null}
      {renderScreen()}
      {toast ? <Toast message={toast} /> : null}
      {openStory ? (
        <StoryViewer
          nickname={openStory.nickname}
          label={openStory.label}
          detail={openStory.detail}
          onClose={() => setOpenStory(null)}
        />
      ) : null}
      {showShareSheet ? (
        <ShareBadgeSheet
          achievements={earnedAchievements}
          onShare={(badge) => void handleShareBadge(badge)}
          onClose={() => setShowShareSheet(false)}
        />
      ) : null}
    </AppFrame>
  );

  function renderScreen(): JSX.Element {
    switch (screen) {
      case 'home':
        return (
          <>
            {accountName ? (
              <FriendsBar
                friends={friends}
                onAddStory={() => setShowShareSheet(true)}
                onOpenStory={handleOpenStory}
              />
            ) : null}
            <Home
              nickname={nickname}
              onNicknameChange={setNickname}
              onPlaySolo={onPlaySolo}
              onChallenge={() => goToMode('?duel')}
              onTogether={() => goToMode('?group')}
              onJoin={() => goToMode('?join')}
              onAccount={() => goToMode('?account')}
              onFriends={() => goToMode('?friends')}
              onGroups={() => goToMode('?groups')}
              onStats={() => goToMode('?me')}
              accountName={accountName}
              onAdmin={() => {
                window.location.search = '?admin';
              }}
            />
          </>
        );
      case 'setup':
        return (
          <Setup
            categorySlug={categorySlug}
            difficulty={difficulty}
            count={count}
            region={region}
            onCategory={setCategorySlug}
            onDifficulty={setDifficulty}
            onCount={setCount}
            onRegion={setRegion}
            onStart={() => void onStart()}
            starting={starting}
          />
        );
      case 'loading':
        return <StatusScreen title="Loading…" />;
      case 'game':
        if (!game) {
          return <StatusScreen title="Loading…" />;
        }
        return (
          <Gameplay
            question={game.questions[game.index]}
            index={game.index}
            total={game.questions.length}
            score={game.score}
            grade={game.grade}
            submitting={submitting}
            isLast={game.index + 1 >= game.questions.length}
            onSelect={(choice) => void onSelect(choice)}
            onNext={onNext}
            onQuit={onQuit}
          />
        );
      case 'completing':
        return <StatusScreen title="Tallying your score…" />;
      case 'results':
        if (!result) {
          return <StatusScreen title="Loading…" />;
        }
        return (
          <SoloResults
            result={result}
            onPlayAgain={onPlayAgain}
            onChallenge={() => goToMode('?duel')}
          />
        );
      case 'error':
        return (
          <StatusScreen
            title="Something went wrong"
            message={errorMessage}
            tone="error"
            actionLabel="Back to home"
            onAction={onQuit}
          />
        );
      default:
        return <StatusScreen title="Loading…" />;
    }
  }
}
