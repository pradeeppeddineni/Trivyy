import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardRow } from './LeaderboardRow';

describe('LeaderboardRow', () => {
  it('renders rank 1 with a "1st place" medal badge', () => {
    render(<LeaderboardRow rank={1} name="Alice" score={9} total={10} />);
    expect(screen.getByLabelText('1st place')).toBeInTheDocument();
  });

  it('renders rank 2 with a "2nd place" medal badge', () => {
    render(<LeaderboardRow rank={2} name="Bob" score={7} total={10} />);
    expect(screen.getByLabelText('2nd place')).toBeInTheDocument();
  });

  it('renders rank 3 with a "3rd place" medal badge', () => {
    render(<LeaderboardRow rank={3} name="Cara" score={5} total={10} />);
    expect(screen.getByLabelText('3rd place')).toBeInTheDocument();
  });

  it('renders rank 4 as a plain number (no medal disc)', () => {
    render(<LeaderboardRow rank={4} name="Dev" score={4} total={10} />);
    // No medal aria-label
    expect(screen.queryByLabelText('1st place')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('2nd place')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('3rd place')).not.toBeInTheDocument();
    // The plain rank number "4" should appear (will match rank span and score span)
    const fours = screen.getAllByText('4');
    expect(fours.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render emoji medals', () => {
    render(<LeaderboardRow rank={1} name="Alice" score={9} total={10} />);
    expect(screen.queryByText('🥇')).not.toBeInTheDocument();
    expect(screen.queryByText('🥈')).not.toBeInTheDocument();
    expect(screen.queryByText('🥉')).not.toBeInTheDocument();
  });

  it('applies winner highlight when isWinner is true', () => {
    const { container } = render(
      <LeaderboardRow rank={1} name="Alice" score={9} total={10} isWinner />,
    );
    // The outer row div should have the winner styling (success-strong border)
    const row = container.firstElementChild as HTMLElement;
    expect(row).toBeTruthy();
    // Border style should differ from non-winner
    expect(row.style.border).toContain('var(--success-strong)');
  });

  it('does not apply winner highlight by default', () => {
    const { container } = render(<LeaderboardRow rank={2} name="Bob" score={7} total={10} />);
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.border).not.toContain('var(--success-strong)');
  });

  it('renders the player name', () => {
    render(<LeaderboardRow rank={1} name="QuizWhiz" score={10} total={10} />);
    expect(screen.getByText('QuizWhiz')).toBeInTheDocument();
  });

  it('renders score and total', () => {
    render(<LeaderboardRow rank={1} name="Alice" score={8} total={10} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('/10')).toBeInTheDocument();
  });

  it('renders the detail line when provided', () => {
    render(<LeaderboardRow rank={1} name="Alice" score={9} total={10} detail="90%" />);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('does not render detail when not provided', () => {
    render(<LeaderboardRow rank={1} name="Alice" score={9} total={10} />);
    // No stray percentage text
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});
