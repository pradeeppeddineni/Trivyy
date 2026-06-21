import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RematchButton } from './RematchButton';

const OPTIONS = { count: 10, categorySlug: 'science', difficulty: 'medium' as const };

describe('RematchButton', () => {
  it('renders a "Play again" button', () => {
    render(<RematchButton options={OPTIONS} onRematch={vi.fn()} />);
    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
  });

  it('calls onRematch with the provided options when clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<RematchButton options={OPTIONS} onRematch={handler} />);
    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(OPTIONS);
  });

  it('is disabled and does not call onRematch when disabled prop is true', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<RematchButton options={OPTIONS} onRematch={handler} disabled />);
    const btn = screen.getByRole('button', { name: /play again/i });
    expect(btn).toBeDisabled();
    await user.click(btn).catch(() => undefined); // click on disabled is a no-op
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls onRematch with different options correctly', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const opts = { count: 5, region: 'IN' as string };
    render(<RematchButton options={opts} onRematch={handler} />);
    await user.click(screen.getByRole('button', { name: /play again/i }));
    expect(handler).toHaveBeenCalledWith(opts);
  });
});
