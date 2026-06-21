import { useEffect, type CSSProperties } from 'react';
import { AnswerPill, type AnswerState } from '../components/AnswerPill';
import { Button } from '../components/Button';
import { GradeBanner } from '../components/GradeBanner';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard, type Difficulty as CardDifficulty } from '../components/QuestionCard';
import { signal } from '../feedback/feedback';
import type { ApiQuestion } from '../api/client';

export interface GradeState {
  readonly selected: string;
  readonly correct: boolean;
  readonly correctAnswer: string;
}

export interface GameplayProps {
  readonly question: ApiQuestion;
  readonly index: number;
  readonly total: number;
  readonly score: number;
  readonly grade: GradeState | null;
  readonly submitting: boolean;
  readonly isLast: boolean;
  readonly onSelect: (choice: string) => void;
  readonly onNext: () => void;
  readonly onQuit: () => void;
}

const TOP: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };

function toCardDifficulty(value: string): CardDifficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }
  return 'any';
}

/** Compute the visual state of one answer pill after grading. */
function pillState(choice: string, grade: GradeState | null): AnswerState {
  if (!grade) {
    return 'idle';
  }
  if (choice === grade.correctAnswer) {
    return 'correct';
  }
  if (choice === grade.selected) {
    return 'incorrect';
  }
  return 'idle';
}

/**
 * Gameplay screen: progress, category/difficulty pills, the question, answer
 * pills with graded correct/incorrect states, a GradeBanner and a Next button.
 */
export function Gameplay(props: GameplayProps): JSX.Element {
  const { question, index, total, score, grade, submitting, isLast, onSelect, onNext, onQuit } =
    props;

  useEffect(() => {
    if (grade !== null) {
      signal(grade.correct ? 'correct' : 'wrong');
    }
  }, [grade]);

  const answered = index + (grade ? 1 : 0);
  const progress = total > 0 ? answered / total : 0;
  const graded = grade !== null;

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 22px 24px',
      }}
    >
      <div style={TOP}>
        <button
          type="button"
          onClick={onQuit}
          aria-label="Quit game"
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '22px',
            color: 'var(--score-total)',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--faint)' }}>
              Question {index + 1} of {total}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
              {score} correct
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </div>

      <div style={{ marginTop: '22px' }}>
        <QuestionCard
          categoryIcon={question.categoryIcon ?? '🎲'}
          categoryLabel={question.category ?? 'Surprise'}
          difficulty={toCardDifficulty(question.difficulty)}
          question={question.text}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {question.choices.map((choice, i) => {
          const state = pillState(choice, grade);
          const dimmed = graded && state === 'idle';
          return (
            <AnswerPill
              key={choice}
              index={i}
              text={choice}
              state={state}
              dimmed={dimmed}
              onClick={graded || submitting ? undefined : () => onSelect(choice)}
            />
          );
        })}
      </div>

      {grade ? (
        <div style={{ marginTop: 'auto', paddingTop: '18px' }}>
          <div style={{ marginBottom: '12px' }}>
            <GradeBanner
              correct={grade.correct}
              message={grade.correct ? 'Nailed it' : 'Not quite'}
            />
          </div>
          <Button
            variant="primary"
            onClick={onNext}
            style={{ background: 'var(--ink-deep)', boxShadow: 'none' }}
          >
            {isLast ? 'See results' : 'Next question'}
          </Button>
        </div>
      ) : null}
    </main>
  );
}
