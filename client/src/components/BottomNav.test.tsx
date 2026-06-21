import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders five tabs and marks the active one', () => {
    render(<BottomNav active="friends" onNavigate={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: /friends/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('navigates to the tab search string on click', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav active="home" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /you/i }));
    expect(onNavigate).toHaveBeenCalledWith('?me');
  });
});
