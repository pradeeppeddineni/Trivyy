import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
