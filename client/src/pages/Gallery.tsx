import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AnswerPill } from '../components/AnswerPill';
import { AvatarPicker } from '../components/AvatarPicker';
import { Button } from '../components/Button';
import { CategoryTile } from '../components/CategoryTile';
import { Chip } from '../components/Chip';
import { FriendsBar } from '../components/FriendsBar';
import { GameCodeCard } from '../components/GameCodeCard';
import { GradeBanner } from '../components/GradeBanner';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { NicknameInput } from '../components/NicknameInput';
import { PlayerHeader } from '../components/PlayerHeader';
import { PlayerRow } from '../components/PlayerRow';
import { ProfileView } from '../components/ProfileView';
import { ProgressBar } from '../components/ProgressBar';
import { QRCard } from '../components/QRCard';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreStat } from '../components/ScoreStat';
import { StoryViewer } from '../components/StoryViewer';
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
        <QRCard value="https://trivyy.com/?join=QM4Z9" />
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

// ---- Phase 1: Profile + Avatar mock data -----------------------------------

const MOCK_ACHIEVEMENTS = [
  {
    key: 'first_game',
    label: 'First Game',
    description: 'Complete your first trivia game.',
    earned: true,
  },
  {
    key: 'ten_games',
    label: 'Dedicated Player',
    description: 'Complete 10 trivia games.',
    earned: true,
  },
  {
    key: 'centurion',
    label: 'Centurion',
    description: 'Answer 100 questions correctly.',
    earned: true,
  },
  {
    key: 'sharpshooter',
    label: 'Sharpshooter',
    description: 'Reach 90% accuracy across at least 20 answers.',
    earned: false,
  },
  {
    key: 'high_scorer',
    label: 'High Scorer',
    description: 'Accumulate 1,000 points.',
    earned: true,
  },
  {
    key: 'marathoner',
    label: 'Marathoner',
    description: 'Complete 50 trivia games.',
    earned: false,
  },
] as const;

const MOCK_RECENT = [
  { mode: 'solo', score: 9, total: 10, at: '2026-06-20T18:00:00Z' },
  { mode: 'duel', score: 7, total: 10, at: '2026-06-19T14:30:00Z' },
  { mode: 'together', score: 8, total: 10, at: '2026-06-18T20:00:00Z' },
] as const;

// ---- Phase 2: FriendsBar + StoryViewer mock data ----------------------------

const MOCK_FRIENDS = [
  {
    id: 'p1',
    nickname: 'Alice',
    username: 'alice',
    online: true,
    hasStory: true,
    avatar: { kind: 'preset' as const, preset: 'blue' },
  },
  {
    id: 'p2',
    nickname: 'Bob',
    username: 'bob',
    online: false,
    hasStory: false,
    avatar: { kind: 'preset' as const, preset: 'green' },
  },
  {
    id: 'p3',
    nickname: 'Cara',
    username: 'cara',
    online: true,
    hasStory: true,
    avatar: { kind: 'preset' as const, preset: 'violet' },
  },
  {
    id: 'p4',
    nickname: 'Dev',
    username: 'dev',
    online: false,
    hasStory: false,
    avatar: { kind: 'none' as const, preset: null },
  },
];

function SocialSection(): JSX.Element {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <p style={CAPTION}>FRIENDS BAR (mixed online / story states)</p>
      <FriendsBar
        friends={MOCK_FRIENDS}
        onAddStory={() => setViewerOpen(true)}
        onOpenStory={() => setViewerOpen(true)}
      />
      <p style={{ ...CAPTION, marginTop: '18px' }}>STORY VIEWER MODAL (mock badge)</p>
      <Button variant="secondary" fullWidth={false} onClick={() => setViewerOpen(true)}>
        Open story viewer
      </Button>
      {viewerOpen ? (
        <StoryViewer
          nickname="Alice"
          label="Centurion"
          detail="Answered 100 questions correctly."
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  );
}

function ProfileSection(): JSX.Element {
  const [activePreset, setActivePreset] = useState<
    'blue' | 'green' | 'pink' | 'amber' | 'violet' | 'teal'
  >('blue');
  const [pickedFile, setPickedFile] = useState<string | null>(null);

  return (
    <>
      <p style={CAPTION}>PROFILE VIEW (preset avatar)</p>
      <div
        style={{
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <ProfileView
          nickname="Pradeep"
          level={{ level: 12, into: 640, span: 1100, pct: 64 }}
          stats={{
            games: 248,
            points: 5120,
            accuracyPct: 81,
            recent: [...MOCK_RECENT],
          }}
          achievements={[...MOCK_ACHIEVEMENTS]}
          avatar={{ kind: 'preset', preset: activePreset }}
        />
      </div>

      <p style={{ ...CAPTION, marginTop: '18px' }}>AVATAR PICKER</p>
      <AvatarPicker
        activePreset={activePreset}
        onPickPreset={(key) => {
          setActivePreset(key);
          setPickedFile(null);
        }}
        onUploadFile={(file) => {
          setPickedFile(file.name);
        }}
      />
      {pickedFile ? (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--success-ink)',
            marginTop: '8px',
            fontWeight: 600,
          }}
        >
          Selected: {pickedFile}
        </p>
      ) : null}
    </>
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
        <Section title="Profile + Avatar (Phase 1)">
          <ProfileSection />
        </Section>
        <Section title="Social bar + Stories (Phase 2)">
          <SocialSection />
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
