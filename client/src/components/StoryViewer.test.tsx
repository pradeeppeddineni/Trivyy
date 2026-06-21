import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryViewer } from './StoryViewer';
import type { StoryViewerProps } from './StoryViewer';

// ---- Fixtures ---------------------------------------------------------------

function makeProps(overrides?: Partial<StoryViewerProps>): StoryViewerProps {
  return {
    nickname: 'Alice',
    label: 'Quiz Wizard',
    detail: 'Answered 50 questions correctly.',
    onClose: vi.fn(),
    ...overrides,
  };
}

// ---- Tests ------------------------------------------------------------------

describe('StoryViewer', () => {
  it("renders the friend's nickname", () => {
    render(<StoryViewer {...makeProps()} />);
    expect(screen.getByRole('heading', { level: 2, name: /Alice/i })).toBeInTheDocument();
  });

  it('renders the badge label', () => {
    render(<StoryViewer {...makeProps()} />);
    expect(screen.getByText('Quiz Wizard')).toBeInTheDocument();
  });

  it('renders the detail text when provided', () => {
    render(<StoryViewer {...makeProps()} />);
    expect(screen.getByText('Answered 50 questions correctly.')).toBeInTheDocument();
  });

  it('does NOT render detail text when detail is null', () => {
    render(<StoryViewer {...makeProps({ detail: null })} />);
    expect(screen.queryByText('Answered 50 questions correctly.')).not.toBeInTheDocument();
  });

  it('does NOT render detail text when detail is undefined', () => {
    render(<StoryViewer {...makeProps({ detail: undefined })} />);
    expect(screen.queryByText('Answered 50 questions correctly.')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<StoryViewer {...makeProps({ onClose })} />);
    await user.click(screen.getByRole('button', { name: /close story/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop area is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<StoryViewer {...makeProps({ onClose })} />);
    // The centering shell is the second child of the fragment root; clicking
    // it (outside the card) should fire onClose.
    const shell = container.children[1] as HTMLElement;
    await user.click(shell);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT render any <input> element', () => {
    render(<StoryViewer {...makeProps()} />);
    expect(document.querySelector('input')).toBeNull();
  });

  it('does NOT render any <textarea> element', () => {
    render(<StoryViewer {...makeProps()} />);
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('does NOT render a comment section', () => {
    render(<StoryViewer {...makeProps()} />);
    expect(screen.queryByText(/comment/i)).not.toBeInTheDocument();
  });
});
