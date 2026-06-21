import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders four tabs and marks the active one', () => {
    render(<BottomNav active="friends" onNavigate={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
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

  it('renders all four expected tab labels', () => {
    render(<BottomNav active="home" onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /home/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /friends/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /boards/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /you/i })).toBeTruthy();
  });

  it('does not render a Play tab', () => {
    render(<BottomNav active="home" onNavigate={() => {}} />);
    expect(screen.queryByRole('button', { name: /^play$/i })).toBeNull();
  });

  it('marks only the active tab with aria-current="page"', () => {
    render(<BottomNav active="boards" onNavigate={() => {}} />);
    const activeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-current') === 'page');
    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0]).toHaveAccessibleName(/boards/i);
  });

  it('fires onNavigate with the correct search string for each tab', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav active="home" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('button', { name: /friends/i }));
    expect(onNavigate).toHaveBeenLastCalledWith('?friends');

    await userEvent.click(screen.getByRole('button', { name: /boards/i }));
    expect(onNavigate).toHaveBeenLastCalledWith('?groups');

    await userEvent.click(screen.getByRole('button', { name: /home/i }));
    expect(onNavigate).toHaveBeenLastCalledWith('');
  });

  it('each tab button contains an SVG icon', () => {
    const { container } = render(<BottomNav active="home" onNavigate={() => {}} />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.querySelector('svg')).not.toBeNull();
    }
    // Confirm total SVGs equals number of tabs.
    expect(container.querySelectorAll('svg')).toHaveLength(4);
  });
});
