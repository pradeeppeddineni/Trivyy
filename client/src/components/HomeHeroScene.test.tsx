import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeHeroScene } from './HomeHeroScene';

const noop = () => undefined;

const defaultProps = {
  accountName: 'Alice',
  onPlaySolo: noop,
  onChallenge: noop,
  onTogether: noop,
};

describe('HomeHeroScene', () => {
  it('renders without throwing', () => {
    expect(() => render(<HomeHeroScene {...defaultProps} />)).not.toThrow();
  });

  it('shows the greeting with the account name', () => {
    render(<HomeHeroScene {...defaultProps} accountName="QuizKing" />);
    expect(screen.getByText(/hi, quizking/i)).toBeInTheDocument();
  });

  it('renders the "Ready to play?" heading', () => {
    render(<HomeHeroScene {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /ready to play/i })).toBeInTheDocument();
  });

  it('renders the PLAY button', () => {
    render(<HomeHeroScene {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument();
  });

  it('calls onPlaySolo when PLAY is clicked', async () => {
    const onPlaySolo = vi.fn();
    render(<HomeHeroScene {...defaultProps} onPlaySolo={onPlaySolo} />);
    await userEvent.click(screen.getByRole('button', { name: /^play$/i }));
    expect(onPlaySolo).toHaveBeenCalledOnce();
  });

  it('renders the Solo mode control', () => {
    render(<HomeHeroScene {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^solo$/i })).toBeInTheDocument();
  });

  it('renders the Duel mode control', () => {
    render(<HomeHeroScene {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^duel$/i })).toBeInTheDocument();
  });

  it('renders the Group mode control', () => {
    render(<HomeHeroScene {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^group$/i })).toBeInTheDocument();
  });

  it('calls onPlaySolo when the Solo chip is clicked', async () => {
    const onPlaySolo = vi.fn();
    render(<HomeHeroScene {...defaultProps} onPlaySolo={onPlaySolo} />);
    await userEvent.click(screen.getByRole('button', { name: /^solo$/i }));
    expect(onPlaySolo).toHaveBeenCalledOnce();
  });

  it('calls onChallenge when the Duel chip is clicked', async () => {
    const onChallenge = vi.fn();
    render(<HomeHeroScene {...defaultProps} onChallenge={onChallenge} />);
    await userEvent.click(screen.getByRole('button', { name: /^duel$/i }));
    expect(onChallenge).toHaveBeenCalledOnce();
  });

  it('calls onTogether when the Group chip is clicked', async () => {
    const onTogether = vi.fn();
    render(<HomeHeroScene {...defaultProps} onTogether={onTogether} />);
    await userEvent.click(screen.getByRole('button', { name: /^group$/i }));
    expect(onTogether).toHaveBeenCalledOnce();
  });
});
