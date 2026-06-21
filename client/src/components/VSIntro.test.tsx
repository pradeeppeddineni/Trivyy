import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VSIntro } from './VSIntro';

// framer-motion is mocked globally in test/setup (or via vitest alias) —
// motion.div renders as a plain div, useReducedMotion returns false.

const LEFT = { nickname: 'Ada', avatar: { kind: 'none' as const, preset: null } };
const RIGHT = { nickname: 'Bob', avatar: { kind: 'none' as const, preset: null } };

describe('VSIntro', () => {
  it('renders both player nicknames', () => {
    render(<VSIntro left={LEFT} right={RIGHT} onStart={vi.fn()} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders avatar initials for both players', () => {
    render(<VSIntro left={LEFT} right={RIGHT} onStart={vi.fn()} />);
    // Initial letters should appear inside avatar circles
    const initials = screen.getAllByText(/^[AB]$/);
    expect(initials.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the START button', () => {
    render(<VSIntro left={LEFT} right={RIGHT} onStart={vi.fn()} />);
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('calls onStart when START button is clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(<VSIntro left={LEFT} right={RIGHT} onStart={handler} />);
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not render START button when onStart is not provided', () => {
    render(<VSIntro left={LEFT} right={RIGHT} />);
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
  });

  it('renders avatar image when avatarSrc is provided with upload kind', () => {
    const leftWithImg = {
      nickname: 'Ada',
      avatar: { kind: 'upload' as const, preset: null },
      avatarSrc: 'https://example.com/ada.jpg',
    };
    render(<VSIntro left={leftWithImg} right={RIGHT} onStart={vi.fn()} />);
    expect(screen.getByAltText(/Ada's avatar/i)).toBeInTheDocument();
  });

  it('renders preset avatar without image for preset kind', () => {
    const leftPreset = {
      nickname: 'Ada',
      avatar: { kind: 'preset' as const, preset: 'blue' },
    };
    render(<VSIntro left={leftPreset} right={RIGHT} onStart={vi.fn()} />);
    // Should show initial, not an img
    expect(screen.queryByAltText(/Ada's avatar.*img/i)).not.toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('auto-calls onStart after autoStartMs', async () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    render(<VSIntro left={LEFT} right={RIGHT} onStart={handler} autoStartMs={3000} />);
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3001);
    expect(handler).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
