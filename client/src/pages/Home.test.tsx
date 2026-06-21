import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';

const noop = () => undefined;

const defaultProps = {
  nickname: '',
  onNicknameChange: noop,
  onPlaySolo: noop,
  onChallenge: noop,
  onTogether: noop,
  onJoin: noop,
  onAccount: noop,
  onFriends: noop,
  onGroups: noop,
  onStats: noop,
  onAdmin: noop,
};

// ---------------------------------------------------------------------------
// Guest state (accountName is null / undefined)
// ---------------------------------------------------------------------------

describe('Home — guest state', () => {
  it('renders the Trivyy heading and tagline', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.getByRole('heading', { name: /trivyy/i })).toBeInTheDocument();
    expect(screen.getByText(/quick trivia duels/i)).toBeInTheDocument();
  });

  it('renders the nickname input', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.getByLabelText(/your nickname/i)).toBeInTheDocument();
  });

  it('renders a "Play as guest" button', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.getByRole('button', { name: /play as guest/i })).toBeInTheDocument();
  });

  it('renders Sign in and Create account CTAs', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders the "Have a code? Join" link', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.getByRole('button', { name: /have a code/i })).toBeInTheDocument();
  });

  it('renders the Admin link in a low-prominence footer', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
  });

  it('does NOT render Friends, Groups, or My Stats social links', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.queryByRole('button', { name: /^friends$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^groups$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /my stats/i })).not.toBeInTheDocument();
  });

  it('does NOT show greeting text (Hi, ...)', () => {
    render(<Home {...defaultProps} accountName={null} />);
    expect(screen.queryByText(/^hi,/i)).not.toBeInTheDocument();
  });

  it('calls onPlaySolo when "Play as guest" is clicked', async () => {
    const onPlaySolo = vi.fn();
    render(<Home {...defaultProps} accountName={null} onPlaySolo={onPlaySolo} />);
    await userEvent.click(screen.getByRole('button', { name: /play as guest/i }));
    expect(onPlaySolo).toHaveBeenCalledOnce();
  });

  it('calls onAccount when "Sign in" is clicked', async () => {
    const onAccount = vi.fn();
    render(<Home {...defaultProps} accountName={null} onAccount={onAccount} />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onAccount).toHaveBeenCalledOnce();
  });

  it('calls onJoin when the join link is clicked', async () => {
    const onJoin = vi.fn();
    render(<Home {...defaultProps} accountName={null} onJoin={onJoin} />);
    await userEvent.click(screen.getByRole('button', { name: /have a code/i }));
    expect(onJoin).toHaveBeenCalledOnce();
  });

  it('shows confirmation text when a nickname is entered', () => {
    render(<Home {...defaultProps} accountName={null} nickname="QuizWhiz" />);
    expect(screen.getByText(/playing as QuizWhiz/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Logged-in state (accountName is set)
// ---------------------------------------------------------------------------

describe('Home — logged-in state', () => {
  it('renders a greeting with the account name', () => {
    render(<Home {...defaultProps} accountName="Alice" />);
    expect(screen.getByText(/hi, alice/i)).toBeInTheDocument();
  });

  it('renders "Ready to play?" headline', () => {
    render(<Home {...defaultProps} accountName="Alice" />);
    expect(screen.getByRole('heading', { name: /ready to play/i })).toBeInTheDocument();
  });

  it('renders the PLAY button', () => {
    render(<Home {...defaultProps} accountName="Alice" />);
    expect(screen.getByRole('button', { name: /^PLAY$/i })).toBeInTheDocument();
  });

  it('renders the three mode chips: Solo, Duel, Group', () => {
    render(<Home {...defaultProps} accountName="Alice" />);
    expect(screen.getByRole('button', { name: /^solo$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^duel$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^group$/i })).toBeInTheDocument();
  });

  it('calls onPlaySolo when PLAY is clicked', async () => {
    const onPlaySolo = vi.fn();
    render(<Home {...defaultProps} accountName="Alice" onPlaySolo={onPlaySolo} />);
    await userEvent.click(screen.getByRole('button', { name: /^PLAY$/i }));
    expect(onPlaySolo).toHaveBeenCalledOnce();
  });

  it('calls onChallenge when Duel chip is clicked', async () => {
    const onChallenge = vi.fn();
    render(<Home {...defaultProps} accountName="Alice" onChallenge={onChallenge} />);
    await userEvent.click(screen.getByRole('button', { name: /^duel$/i }));
    expect(onChallenge).toHaveBeenCalledOnce();
  });

  it('calls onTogether when Group chip is clicked', async () => {
    const onTogether = vi.fn();
    render(<Home {...defaultProps} accountName="Alice" onTogether={onTogether} />);
    await userEvent.click(screen.getByRole('button', { name: /^group$/i }));
    expect(onTogether).toHaveBeenCalledOnce();
  });

  it('does NOT render "Play as guest" or Sign in CTAs', () => {
    render(<Home {...defaultProps} accountName="Alice" />);
    expect(screen.queryByRole('button', { name: /play as guest/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('does NOT render the admin link (admin is guest-only footer item)', () => {
    render(<Home {...defaultProps} accountName="Alice" />);
    expect(screen.queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument();
  });
});
