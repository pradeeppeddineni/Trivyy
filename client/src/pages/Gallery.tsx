import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AnswerPill } from '../components/AnswerPill';
import { Button } from '../components/Button';
import { CategoryTile } from '../components/CategoryTile';
import { Chip } from '../components/Chip';
import { GameCodeCard } from '../components/GameCodeCard';
import { GradeBanner } from '../components/GradeBanner';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { NicknameInput } from '../components/NicknameInput';
import { PlayerHeader } from '../components/PlayerHeader';
import { PlayerRow } from '../components/PlayerRow';
import { ProgressBar } from '../components/ProgressBar';
import { QRCard } from '../components/QRCard';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreStat } from '../components/ScoreStat';
import { Toast } from '../components/Toast';

const SECTION_LABEL: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '18px',
  color: 'var(--ink)',
  margin: '0 0 12px',
};

const CAPTION: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--faint)',
  letterSpacing: '0.4px',
  margin: '0 0 8px',
};

function Section(props: { readonly title: string; readonly children: ReactNode }): JSX.Element {
  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h3 style={SECTION_LABEL}>{props.title}</h3>
      {props.children}
    </section>
  );
}

const CATEGORIES = [
  { id: 'science', icon: '🔬', label: 'Science' },
  { id: 'geography', icon: '🌍', label: 'Geography' },
  { id: 'movies', icon: '🎬', label: 'Movies' },
  { id: 'music', icon: '🎵', label: 'Music' },
] as const;

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Any'] as const;
const COUNTS = ['5', '10', '15'] as const;

function InteractivePickers(): JSX.Element {
  const [category, setCategory] = useState('science');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState('10');

  return (
    <>
      <p style={CAPTION}>CATEGORY TILES (selectable)</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '11px',
        }}
      >
        {CATEGORIES.map((c) => (
          <CategoryTile
            key={c.id}
            icon={c.icon}
            label={c.label}
            selected={category === c.id}
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      <p style={{ ...CAPTION, marginTop: '18px' }}>DIFFICULTY CHIPS</p>
      <div style={{ display: 'flex', gap: '9px' }}>
        {DIFFICULTIES.map((d) => (
          <Chip key={d} label={d} selected={difficulty === d} onClick={() => setDifficulty(d)} />
        ))}
      </div>

      <p style={{ ...CAPTION, marginTop: '18px' }}>COUNT CHIPS</p>
      <div style={{ display: 'flex', gap: '9px' }}>
        {COUNTS.map((n) => (
          <Chip key={n} label={n} selected={count === n} onClick={() => setCount(n)} />
        ))}
      </div>
    </>
  );
}

function ButtonsSection(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Button variant="primary">Primary · Play solo</Button>
      <Button variant="secondary">Secondary · Challenge a friend</Button>
      <Button variant="warning">Warning · Play together</Button>
      <Button variant="ghost">Ghost · Have a code?</Button>
      <div style={{ display: 'flex', gap: '9px' }}>
        <Button size="sm" fullWidth={false}>
          Small
        </Button>
        <Button size="md" fullWidth={false}>
          Medium
        </Button>
        <Button size="lg" fullWidth={false}>
          Large
        </Button>
      </div>
    </div>
  );
}

function GameplaySection(): JSX.Element {
  return (
    <>
      <ProgressBar value={0.4} />
      <div style={{ height: '16px' }} />
      <QuestionCard
        categoryIcon="🔬"
        categoryLabel="Science"
        difficulty="medium"
        question="How many bones are in the adult human body?"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnswerPill index={0} text="206" state="correct" />
        <AnswerPill index={1} text="201" state="incorrect" />
        <AnswerPill index={2} text="226" state="idle" dimmed />
        <AnswerPill index={3} text="180" state="selected" />
      </div>
      <div style={{ marginTop: '18px' }}>
        <GradeBanner correct message="Nailed it" />
      </div>
      <div style={{ marginTop: '12px' }}>
        <GradeBanner correct={false} />
      </div>
    </>
  );
}

function CodesSection(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <GameCodeCard code="X7K2P" />
      <GameCodeCard code="QM4Z9" label="GAME CODE">
        <QRCard />
      </GameCodeCard>
    </div>
  );
}

function LobbySection(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      <PlayerRow name="Ava" statusText="Ready to play" isYou playLabel="Play" />
      <PlayerRow name="Bo" statusText="Playing now…" />
      <PlayerRow name="Cy" statusText="Finished" scoreText="8/10" />
    </div>
  );
}

function LeaderboardSection(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <LeaderboardRow rank={1} name="Ava" score={9} total={10} detail="90%" isWinner />
      <LeaderboardRow rank={2} name="Cy" score={8} total={10} detail="80%" />
      <LeaderboardRow rank={3} name="Bo" score={6} total={10} detail="60%" />
    </div>
  );
}

function StatsSection(): JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
      <ScoreStat label="Games played" value="128" icon="🎮" />
      <ScoreStat label="Players" value="46" icon="👥" />
      <ScoreStat label="Questions" value="240" icon="❓" />
      <ScoreStat label="Avg score" value="72%" icon="📊" />
    </div>
  );
}

const PAGE: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 'var(--app-width)',
  margin: '0 auto',
  minHeight: '100dvh',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow-frame)',
  display: 'flex',
  flexDirection: 'column',
};

/** Storybook-style preview of every Phase 0 component in its states (DOD-3). */
export function Gallery(): JSX.Element {
  const [showToast, setShowToast] = useState(true);

  return (
    <div style={PAGE}>
      <PlayerHeader nickname="QuizWhiz" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          padding: '18px 18px 48px',
        }}
      >
        <Section title="Buttons">
          <ButtonsSection />
        </Section>
        <Section title="Nickname input">
          <NicknameInput
            value="QuizWhiz"
            onChange={() => undefined}
            confirmation="You're playing as QuizWhiz"
          />
        </Section>
        <Section title="Setup pickers">
          <InteractivePickers />
        </Section>
        <Section title="Gameplay">
          <GameplaySection />
        </Section>
        <Section title="Game code & QR">
          <CodesSection />
        </Section>
        <Section title="Lobby roster">
          <LobbySection />
        </Section>
        <Section title="Leaderboard">
          <LeaderboardSection />
        </Section>
        <Section title="Admin stats">
          <StatsSection />
        </Section>
        <Section title="Toast">
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={() => setShowToast((value) => !value)}
          >
            Toggle toast
          </Button>
        </Section>
      </div>
      {showToast ? <Toast message="Link copied!" /> : null}
    </div>
  );
}
