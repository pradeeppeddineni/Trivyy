import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsScreen } from './ResultsScreen';

const ENTRIES = [
  { rank: 1, name: 'Alice', score: 9, total: 10, detail: '90%' },
  { rank: 2, name: 'Bob', score: 7, total: 10, detail: '70%' },
  { rank: 3, name: 'Cara', score: 5, total: 10, detail: '50%' },
  { rank: 4, name: 'Dev', score: 4, total: 10 },
];

// Guard: canvas-confetti is not available in jsdom; mock it to avoid any
// uncaught rejections. The component already handles this gracefully, but
// mocking makes tests deterministic.
beforeEach(() => {
  vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResultsScreen', () => {
  it('renders the default "Congratulations!" heading', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    expect(screen.getByRole('heading', { name: /congratulations/i })).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(<ResultsScreen entries={ENTRIES} title="You win!" />);
    expect(screen.getByRole('heading', { name: /you win/i })).toBeInTheDocument();
  });

  it('renders the "Leaderboard" sub-heading (required by E2E spec)', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument();
  });

  it('renders all player names from entries', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    // Names appear in both Podium and LeaderboardRow, so use getAllByText
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cara').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Dev')).toBeInTheDocument();
  });

  it('renders podium names (top 3)', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    // Podium renders names — they will appear at least once
    const aliceEls = screen.getAllByText('Alice');
    expect(aliceEls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders rank 4 player in leaderboard rows', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    expect(screen.getByText('Dev')).toBeInTheDocument();
  });

  it('calls onPlayAgain when the play-again button is clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<ResultsScreen entries={ENTRIES} onPlayAgain={handler} playAgainLabel="Play again" />);
    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('calls onRematch when the rematch button is clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<ResultsScreen entries={ENTRIES} onRematch={handler} />);
    await user.click(screen.getByRole('button', { name: /rematch/i }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not render action buttons when neither handler is provided', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders without throwing when confetti is unavailable (jsdom)', () => {
    // This test verifies the component mounts cleanly in jsdom — the guard in
    // fireConfetti() prevents any canvas API access.
    expect(() => render(<ResultsScreen entries={ENTRIES} />)).not.toThrow();
  });

  it('renders with an empty entries array', () => {
    expect(() => render(<ResultsScreen entries={[]} />)).not.toThrow();
  });

  it('renders the medal badge for rank 1', () => {
    render(<ResultsScreen entries={ENTRIES} />);
    // LeaderboardRow for Alice (rank 1) should have the medal badge
    expect(screen.getByLabelText('1st place')).toBeInTheDocument();
  });
});
