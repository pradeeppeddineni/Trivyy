import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { SpinWheel } from './SpinWheel';

const SEGMENTS = [
  { key: 'science', label: 'Science', color: '#1f6bff' },
  { key: 'geography', label: 'Geography', color: '#16a765' },
  { key: 'movies', label: 'Movies', color: '#e91e8c' },
  { key: 'music', label: 'Music', color: '#f5a623' },
  { key: 'history', label: 'History', color: '#7c3aed' },
  { key: 'tech', label: 'Tech', color: '#0f9fa5' },
];

describe('SpinWheel', () => {
  it('renders all segment labels', () => {
    render(<SpinWheel segments={SEGMENTS} onResult={vi.fn()} />);
    for (const seg of SEGMENTS) {
      // Labels appear at least once (wheel span + hidden list).
      const matches = screen.getAllByText(seg.label);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders the SPIN button', () => {
    render(<SpinWheel segments={SEGMENTS} onResult={vi.fn()} />);
    expect(screen.getByRole('button', { name: /spin the wheel/i })).toBeInTheDocument();
  });

  it('calls onResult with the expected key after spin settles (pickIndex=2 → movies)', () => {
    vi.useFakeTimers();
    const handler = vi.fn();

    render(<SpinWheel segments={SEGMENTS} onResult={handler} pickIndex={2} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /spin the wheel/i }));
    });

    // Advance past the spin duration + buffer (3200 ms + 50 ms).
    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith('movies'); // index 2

    vi.useRealTimers();
  });

  it('calls onResult with the correct segment for pickIndex=0 (science)', () => {
    vi.useFakeTimers();
    const handler = vi.fn();

    render(<SpinWheel segments={SEGMENTS} onResult={handler} pickIndex={0} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /spin the wheel/i }));
    });

    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(handler).toHaveBeenCalledWith('science');
    vi.useRealTimers();
  });

  it('disables the SPIN button while spinning and re-enables after settle', () => {
    vi.useFakeTimers();

    render(<SpinWheel segments={SEGMENTS} onResult={vi.fn()} pickIndex={0} />);
    const btn = screen.getByRole('button', { name: /spin the wheel/i });

    act(() => {
      fireEvent.click(btn);
    });

    expect(btn).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(btn).not.toBeDisabled();
    vi.useRealTimers();
  });

  it('renders without error given an empty segment list', () => {
    render(<SpinWheel segments={[]} onResult={vi.fn()} />);
    expect(screen.getByRole('button', { name: /spin the wheel/i })).toBeInTheDocument();
  });

  it('calls onResult with the correct key for the last segment (pickIndex=5 → tech)', () => {
    vi.useFakeTimers();
    const handler = vi.fn();

    render(<SpinWheel segments={SEGMENTS} onResult={handler} pickIndex={5} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /spin the wheel/i }));
    });

    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(handler).toHaveBeenCalledWith('tech');
    vi.useRealTimers();
  });
});
