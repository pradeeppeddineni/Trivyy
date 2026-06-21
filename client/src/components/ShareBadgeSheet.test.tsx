import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareBadgeSheet } from './ShareBadgeSheet';

// ---- Fixtures ---------------------------------------------------------------

const ACHIEVEMENTS = [
  { key: 'first_game', label: 'First Game', description: 'Complete your first trivia game.' },
  { key: 'dedicated', label: 'Dedicated Player', description: 'Complete 10 trivia games.' },
];

// ---- Tests ------------------------------------------------------------------

describe('ShareBadgeSheet', () => {
  it('renders the sheet title "Share a badge"', () => {
    render(<ShareBadgeSheet achievements={ACHIEVEMENTS} onShare={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: /share a badge/i })).toBeInTheDocument();
  });

  it('renders all achievement items by their label text', () => {
    render(<ShareBadgeSheet achievements={ACHIEVEMENTS} onShare={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('First Game')).toBeInTheDocument();
    expect(screen.getByText('Dedicated Player')).toBeInTheDocument();
  });

  it('calls onShare with { label, detail: description } when an achievement item is clicked', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(<ShareBadgeSheet achievements={ACHIEVEMENTS} onShare={onShare} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Share First Game' }));
    expect(onShare).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledWith({
      label: 'First Game',
      detail: 'Complete your first trivia game.',
    });
  });

  it('renders the close button and clicking it calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShareBadgeSheet achievements={ACHIEVEMENTS} onShare={vi.fn()} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /close sheet/i });
    expect(closeBtn).toBeInTheDocument();
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows "No earned achievements yet" message when achievements array is empty', () => {
    render(<ShareBadgeSheet achievements={[]} onShare={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/no earned achievements yet/i)).toBeInTheDocument();
  });

  it('does NOT call onClose when the sheet card is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShareBadgeSheet achievements={ACHIEVEMENTS} onShare={vi.fn()} onClose={onClose} />);
    // Click the dialog element itself (not the backdrop)
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShareBadgeSheet achievements={ACHIEVEMENTS} onShare={vi.fn()} onClose={onClose} />);
    const backdrop = screen.getByTestId('backdrop');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
