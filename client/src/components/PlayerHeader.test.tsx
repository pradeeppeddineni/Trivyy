import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerHeader } from './PlayerHeader';

describe('PlayerHeader', () => {
  it('renders the Trivyy logo', () => {
    render(<PlayerHeader />);
    expect(screen.getByText('Trivyy')).toBeInTheDocument();
  });

  it('renders the nickname chip when a nickname is provided', () => {
    render(<PlayerHeader nickname="Alice" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders nothing for the chip when no nickname is provided', () => {
    render(<PlayerHeader />);
    // The account menu button should not appear.
    expect(screen.queryByRole('button', { name: /account menu/i })).toBeNull();
  });

  it('shows no menu when nickname provided but no menu handlers', () => {
    render(<PlayerHeader nickname="Alice" />);
    // Chip is still rendered but as a non-interactive button without popups.
    const chip = screen.queryByRole('button', { name: /account menu/i });
    // Without handlers the button is accessible but aria-haspopup is absent.
    expect(chip).toBeNull();
  });

  it('account menu button is present when handlers are provided', () => {
    render(
      <PlayerHeader
        nickname="Alice"
        onProfile={vi.fn()}
        onSettings={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
  });

  it('opens account menu on chip click and exposes Profile, Settings, Sign out', async () => {
    render(
      <PlayerHeader
        nickname="Alice"
        onProfile={vi.fn()}
        onSettings={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls the injected sign-out handler when Sign out is clicked', async () => {
    const onSignOut = vi.fn();
    render(
      <PlayerHeader
        nickname="Alice"
        onProfile={vi.fn()}
        onSettings={vi.fn()}
        onSignOut={onSignOut}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('calls the injected onProfile handler when Profile is clicked', async () => {
    const onProfile = vi.fn();
    render(
      <PlayerHeader
        nickname="Alice"
        onProfile={onProfile}
        onSettings={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /profile/i }));
    expect(onProfile).toHaveBeenCalledOnce();
  });

  it('closes the menu after a menu item is clicked', async () => {
    render(
      <PlayerHeader
        nickname="Alice"
        onProfile={vi.fn()}
        onSettings={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: /profile/i }));
    expect(screen.queryByRole('menuitem', { name: /profile/i })).toBeNull();
  });

  it('closes the menu on Escape key', async () => {
    render(
      <PlayerHeader
        nickname="Alice"
        onProfile={vi.fn()}
        onSettings={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: /sign out/i })).toBeNull();
  });

  it('calls onLogoClick when the logo button is pressed', async () => {
    const onLogoClick = vi.fn();
    render(<PlayerHeader onLogoClick={onLogoClick} />);
    await userEvent.click(screen.getByRole('button', { name: /go to home/i }));
    expect(onLogoClick).toHaveBeenCalledOnce();
  });
});
