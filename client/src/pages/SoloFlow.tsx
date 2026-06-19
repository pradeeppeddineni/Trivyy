import { useCallback, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PlayerHeader } from '../components/PlayerHeader';
import { StatusScreen } from '../components/StatusScreen';
import { Toast } from '../components/Toast';
import { Home } from './Home';
import { Setup } from './Setup';
import { Gameplay, type GradeState } from './Gameplay';
import { SoloResults } from './SoloResults';
import {
  createSession,
  createSoloGame,
  submitAnswer,
  completeGame,
  getResult,
  type ApiQuestion,
  type Difficulty,
  type ResultResponse,
} from '../api/client';

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
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const flashToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const comingSoon = useCallback(
    (label: string) => flashToast(`${label} is coming soon`),
    [flashToast],
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
  }, [nickname, count, categorySlug, difficulty, flashToast, goError]);

  const onSelect = useCallback(
    async (choice: string) => {
      if (!game || game.grade) {
        return;
      }
      setSubmitting(true);
      try {
        const current = game.questions[game.index];
        const graded = await submitAnswer(game.gameId, current.id, choice);
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
    </AppFrame>
  );

  function renderScreen(): JSX.Element {
    switch (screen) {
      case 'home':
        return (
          <Home
            nickname={nickname}
            onNicknameChange={setNickname}
            onPlaySolo={onPlaySolo}
            onComingSoon={comingSoon}
            onAdmin={() => {
              window.location.search = '?admin';
            }}
          />
        );
      case 'setup':
        return (
          <Setup
            categorySlug={categorySlug}
            difficulty={difficulty}
            count={count}
            onCategory={setCategorySlug}
            onDifficulty={setDifficulty}
            onCount={setCount}
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
        return <SoloResults result={result} onPlayAgain={onPlayAgain} onComingSoon={comingSoon} />;
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
