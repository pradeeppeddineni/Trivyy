import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SettingsFlow } from './SettingsFlow';

describe('SettingsFlow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('renders a heading and the dark-mode switch', () => {
    render(
      <ThemeProvider>
        <SettingsFlow />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /dark mode/i })).toBeInTheDocument();
  });

  it('renders Sound and Haptics switches defaulting to on', () => {
    render(
      <ThemeProvider>
        <SettingsFlow />
      </ThemeProvider>,
    );
    const soundSwitch = screen.getByRole('switch', { name: /sound/i });
    const hapticsSwitch = screen.getByRole('switch', { name: /haptics/i });
    expect(soundSwitch).toHaveAttribute('aria-checked', 'true');
    expect(hapticsSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles Sound off and persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <SettingsFlow />
      </ThemeProvider>,
    );
    const soundSwitch = screen.getByRole('switch', { name: /sound/i });
    await userEvent.click(soundSwitch);
    expect(soundSwitch).toHaveAttribute('aria-checked', 'false');
    const stored = JSON.parse(localStorage.getItem('trivyy.feedback') ?? '{}');
    expect(stored.sound).toBe(false);
  });

  it('toggles Haptics off and persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <SettingsFlow />
      </ThemeProvider>,
    );
    const hapticsSwitch = screen.getByRole('switch', { name: /haptics/i });
    await userEvent.click(hapticsSwitch);
    expect(hapticsSwitch).toHaveAttribute('aria-checked', 'false');
    const stored = JSON.parse(localStorage.getItem('trivyy.feedback') ?? '{}');
    expect(stored.haptics).toBe(false);
  });
});
