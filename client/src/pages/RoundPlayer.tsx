import { useCallback, useState } from 'react';
import { Gameplay, type GradeState } from './Gameplay';
import { StatusScreen } from '../components/StatusScreen';
import { submitAnswer, completeGame, type ApiQuestion } from '../api/client';

export interface RoundPlayerProps {
  readonly gameId: string;
  readonly questions: ReadonlyArray<ApiQuestion>;
  /** Called after the round is completed server-side. */
  readonly onComplete: () => void;
  readonly onError: (message: string) => void;
  readonly onQuit: () => void;
}

/**
 * Plays a locked question set to completion: grades each answer server-side,
 * tracks the running score, and calls `onComplete` once the final answer is in.
 * Shared by every mode that plays a round (duel, group) so the play loop lives
 * in one place.
 */
export function RoundPlayer(props: RoundPlayerProps): JSX.Element {
  const { gameId, questions, onComplete, onError, onQuit } = props;
  const [index, setIndex] = useState(0);
  const [grade, setGrade] = useState<GradeState | null>(null);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const onSelect = useCallback(
    async (choice: string) => {
      if (grade) {
        return;
      }
      setSubmitting(true);
      try {
        const graded = await submitAnswer(gameId, questions[index].id, choice);
        setGrade({
          selected: choice,
          correct: graded.correct,
          correctAnswer: graded.correctAnswer,
        });
        if (graded.correct) {
          setScore((prev) => prev + 1);
        }
      } catch {
        onError('We could not record your answer. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [grade, gameId, questions, index, onError],
  );

  const onNext = useCallback(async () => {
    const isLast = index + 1 >= questions.length;
    if (!isLast) {
      setIndex((prev) => prev + 1);
      setGrade(null);
      return;
    }
    setCompleting(true);
    try {
      await completeGame(gameId);
      onComplete();
    } catch {
      onError('We could not finish your round. Please try again.');
      setCompleting(false);
    }
  }, [index, questions.length, gameId, onComplete, onError]);

  if (completing) {
    return <StatusScreen title="Tallying your score…" />;
  }

  return (
    <Gameplay
      question={questions[index]}
      index={index}
      total={questions.length}
      score={score}
      grade={grade}
      submitting={submitting}
      isLast={index + 1 >= questions.length}
      onSelect={(choice) => void onSelect(choice)}
      onNext={() => void onNext()}
      onQuit={onQuit}
    />
  );
}
