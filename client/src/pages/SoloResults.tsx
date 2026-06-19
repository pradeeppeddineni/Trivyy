import type { CSSProperties } from 'react';
import { Button } from '../components/Button';
import type { ResultResponse } from '../api/client';

export interface SoloResultsProps {
  readonly result: ResultResponse;
  readonly onPlayAgain: () => void;
  readonly onComingSoon: (label: string) => void;
}

const REVIEW_CARD: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 15px',
  boxShadow: 'var(--shadow-card)',
};

function headline(ratio: number): { title: string; sub: string } {
  if (ratio === 1) {
    return { title: 'Perfect run', sub: 'You answered every single one.' };
  }
  if (ratio >= 0.7) {
    return { title: 'Nice run', sub: 'You really know your stuff.' };
  }
  if (ratio >= 0.4) {
    return { title: 'Good effort', sub: 'Solid — a rematch could tip it.' };
  }
  return { title: 'Keep going', sub: 'Everyone starts somewhere. Try again.' };
}

/** Solo results: score headline, per-question review, Play again. */
export function SoloResults(props: SoloResultsProps): JSX.Element {
  const { result, onPlayAgain, onComingSoon } = props;
  const ratio = result.total > 0 ? result.score / result.total : 0;
  const { title, sub } = headline(ratio);
  const iconBg =
    ratio >= 0.7 ? 'var(--success-strong)' : ratio >= 0.4 ? 'var(--accent)' : 'var(--warning)';

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 22px 26px',
        overflowY: 'auto',
      }}
    >
      <div style={{ textAlign: 'center', padding: '24px 0 18px' }}>
        <div
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            display: 'inline-grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: '40px',
            background: iconBg,
            boxShadow: 'var(--shadow-result-icon)',
          }}
        >
          {ratio >= 0.4 ? '🏆' : '🎯'}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '30px',
            margin: '10px 0 2px',
            color: 'var(--ink)',
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0 }}>{sub}</p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '4px',
            marginTop: '18px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--border-accent-soft)',
            padding: '14px 28px',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '46px',
              color: 'var(--accent)',
              lineHeight: 1,
            }}
          >
            {result.score}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '22px',
              color: 'var(--score-total)',
            }}
          >
            / {result.total}
          </span>
        </div>
      </div>

      <p
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--faint)',
          letterSpacing: '0.5px',
          margin: '8px 0 11px',
        }}
      >
        REVIEW
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {result.review.map((row, i) => (
          <div key={i} style={REVIEW_CARD}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span
                style={{
                  fontSize: '16px',
                  lineHeight: 1.3,
                  fontWeight: 800,
                  color: row.isCorrect ? 'var(--success)' : 'var(--danger-bar)',
                }}
              >
                {row.isCorrect ? '✓' : '✕'}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    margin: '0 0 7px',
                    lineHeight: 1.35,
                  }}
                >
                  {row.question}
                </p>
                <p
                  style={{
                    fontSize: '13.5px',
                    margin: 0,
                    color: row.isCorrect ? 'var(--success)' : 'var(--danger)',
                    fontWeight: 600,
                  }}
                >
                  Your answer: {row.your ?? 'No answer'}
                </p>
                {!row.isCorrect ? (
                  <p
                    style={{
                      fontSize: '13.5px',
                      margin: '4px 0 0',
                      color: 'var(--success)',
                      fontWeight: 600,
                    }}
                  >
                    Correct: {row.correct}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '22px' }}>
        <Button variant="primary" onClick={onPlayAgain}>
          Play again
        </Button>
        <Button variant="secondary" onClick={() => onComingSoon('Challenge a friend')}>
          Challenge a friend with this set
        </Button>
      </div>
    </main>
  );
}
