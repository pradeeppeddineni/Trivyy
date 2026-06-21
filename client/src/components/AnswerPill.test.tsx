import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerPill } from './AnswerPill';

describe('AnswerPill', () => {
  beforeEach(() => {
    // Stub matchMedia for reduced-motion hook
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('renders the A badge and text in idle state', () => {
    render(<AnswerPill index={0} text="Paris" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('data-answer-state', 'idle');
  });

  it('renders a checkmark badge in correct state', () => {
    render(<AnswerPill index={0} text="Paris" state="correct" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-answer-state', 'correct');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders an X badge in incorrect state', () => {
    render(<AnswerPill index={0} text="Paris" state="incorrect" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-answer-state', 'incorrect');
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('applies okpulse animation style in correct state when motion is allowed', () => {
    render(<AnswerPill index={0} text="Paris" state="correct" />);
    const btn = screen.getByRole('button');
    expect(btn.style.animation).toMatch(/okpulse/);
  });

  it('applies shake animation style in incorrect state when motion is allowed', () => {
    render(<AnswerPill index={0} text="Paris" state="incorrect" />);
    const btn = screen.getByRole('button');
    expect(btn.style.animation).toMatch(/shake/);
  });

  it('does NOT apply animation in correct state when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<AnswerPill index={0} text="Paris" state="correct" />);
    const btn = screen.getByRole('button');
    expect(btn.style.animation).toBeFalsy();
  });

  it('does NOT apply animation in incorrect state when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<AnswerPill index={0} text="Paris" state="incorrect" />);
    const btn = screen.getByRole('button');
    expect(btn.style.animation).toBeFalsy();
  });

  it('renders B, C, D badges for indices 1, 2, 3', () => {
    const { rerender } = render(<AnswerPill index={1} text="London" />);
    expect(screen.getByText('B')).toBeInTheDocument();
    rerender(<AnswerPill index={2} text="London" />);
    expect(screen.getByText('C')).toBeInTheDocument();
    rerender(<AnswerPill index={3} text="London" />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
