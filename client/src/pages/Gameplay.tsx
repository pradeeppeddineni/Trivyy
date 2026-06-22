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

const HEADER_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 20px 10px',
};

const QUIT_BTN: CSSProperties = {
  flex: 'none',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '1.5px solid var(--border)',
  background: 'var(--card)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: 'var(--muted)',
  fontSize: '14px',
  lineHeight: 1,
  boxShadow: 'var(--shadow-card-soft)',
};

const PROGRESS_META: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: '7px',
};

const QUESTION_LABEL: CSSProperties = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.2px',
};

const SCORE_LABEL: CSSProperties = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: 'var(--accent)',
};

const GRADE_AREA: CSSProperties = {
  marginTop: 'auto',
  paddingTop: '18px',
};

const BANNER_WRAP: CSSProperties = {
  marginBottom: '14px',
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface-muted)',
  border: '1px solid var(--border-faint)',
};

/**
 * Gameplay screen: progress, category/difficulty header on the card, question,
 * answer pills with graded correct/incorrect states, GradeBanner and Next button.
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
        background: 'var(--surface-faint)',
        minHeight: 0,
      }}
    >
      {/* ---- Header row: quit + progress ---- */}
      <div style={HEADER_ROW}>
        <button type="button" onClick={onQuit} aria-label="Quit game" style={QUIT_BTN}>
          ✕
        </button>
        <div style={{ flex: 1 }}>
          <div style={PROGRESS_META}>
            <span style={QUESTION_LABEL}>
              Question {index + 1} of {total}
            </span>
            <span style={SCORE_LABEL}>{score} correct</span>
          </div>
          <ProgressBar
            value={progress}
            height={7}
            fillColor="var(--accent)"
            trackColor="var(--border)"
          />
        </div>
      </div>

      {/* ---- Scrollable content ---- */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '6px 18px 24px',
          overflowY: 'auto',
          gap: 0,
        }}
      >
        {/* Premium question card with gradient header */}
        <div style={{ marginBottom: '16px' }}>
          <QuestionCard
            categoryIcon={question.categoryIcon ?? 'any'}
            categoryLabel={question.category ?? 'Surprise'}
            difficulty={toCardDifficulty(question.difficulty)}
            question={question.text}
          />
        </div>

        {/* Answer pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* Grade feedback + next button */}
        {grade ? (
          <div style={GRADE_AREA}>
            <div style={BANNER_WRAP}>
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
      </div>
    </main>
  );
}
