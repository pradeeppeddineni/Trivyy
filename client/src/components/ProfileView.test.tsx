import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileView } from './ProfileView';
import type { ProfileViewProps } from './ProfileView';

// ---- Fixtures ---------------------------------------------------------------

const LEVEL = { level: 5, into: 120, span: 500, pct: 24 };

const STATS = {
  games: 42,
  points: 1800,
  accuracyPct: 76,
  recent: [
    { mode: 'solo', score: 8, total: 10, at: '2026-06-20T10:00:00Z' },
    { mode: 'duel', score: 6, total: 10, at: '2026-06-19T09:00:00Z' },
  ],
};

const ACHIEVEMENTS = [
  {
    key: 'first_game',
    label: 'First Game',
    description: 'Complete your first trivia game.',
    earned: true,
  },
  {
    key: 'sharpshooter',
    label: 'Sharpshooter',
    description: 'Reach 90% accuracy across at least 20 answers.',
    earned: false,
  },
];

const AVATAR = { kind: 'preset' as const, preset: 'blue' };

function makeProps(overrides?: Partial<ProfileViewProps>): ProfileViewProps {
  return {
    nickname: 'TestUser',
    level: LEVEL,
    stats: STATS,
    achievements: ACHIEVEMENTS,
    avatar: AVATAR,
    ...overrides,
  };
}

// ---- Tests ------------------------------------------------------------------

describe('ProfileView', () => {
  it('renders the player nickname', () => {
    render(<ProfileView {...makeProps()} />);
    expect(screen.getByRole('heading', { level: 1, name: /TestUser/i })).toBeInTheDocument();
  });

  it('renders the level badge', () => {
    render(<ProfileView {...makeProps()} />);
    expect(screen.getByText(/Lv 5/i)).toBeInTheDocument();
  });

  it('renders the XP progress bar with correct aria values', () => {
    render(<ProfileView {...makeProps()} />);
    const bar = screen.getByRole('progressbar', { name: /XP progress/i });
    expect(bar).toHaveAttribute('aria-valuenow', '24');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders all three stat cards', () => {
    render(<ProfileView {...makeProps()} />);
    const statsRegion = screen.getByLabelText(/profile stats/i);
    expect(statsRegion).toBeInTheDocument();
    // Games
    expect(screen.getByText('42')).toBeInTheDocument();
    // Points (toLocaleString varies by locale; match presence)
    expect(screen.getByText(/1[,.]?800/)).toBeInTheDocument();
    // Accuracy
    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('renders earned achievement labels', () => {
    render(<ProfileView {...makeProps()} />);
    expect(screen.getByLabelText('First Game')).toBeInTheDocument();
  });

  it('renders locked achievements as dimmed with accessible label', () => {
    render(<ProfileView {...makeProps()} />);
    expect(screen.getByLabelText('Sharpshooter (locked)')).toBeInTheDocument();
  });

  it('renders recent game entries', () => {
    render(<ProfileView {...makeProps()} />);
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('Duel')).toBeInTheDocument();
  });

  it('shows avatar initial for preset kind', () => {
    render(<ProfileView {...makeProps({ nickname: 'Pradeep' })} />);
    // Initial 'P' is the first character of the nickname
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('renders an img element when kind is upload and avatarSrc is provided', () => {
    render(
      <ProfileView
        {...makeProps({
          avatar: { kind: 'upload', preset: null },
          avatarSrc: '/api/players/42/avatar',
        })}
      />,
    );
    const img = screen.getByAltText(/avatar/i);
    expect(img).toHaveAttribute('src', '/api/players/42/avatar');
  });

  it('calls onEditAvatar when the camera button is clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<ProfileView {...makeProps({ onEditAvatar: handler })} />);
    await user.click(screen.getByRole('button', { name: /edit avatar/i }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('hides recent section when there are no recent games', () => {
    render(<ProfileView {...makeProps({ stats: { ...STATS, recent: [] } })} />);
    expect(screen.queryByText(/recent games/i)).not.toBeInTheDocument();
  });

  it('hides achievements section when array is empty', () => {
    render(<ProfileView {...makeProps({ achievements: [] })} />);
    expect(screen.queryByText(/achievements/i)).not.toBeInTheDocument();
  });
});
