import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendsBar } from './FriendsBar';

// ---- Mock data --------------------------------------------------------------

const FRIENDS = [
  {
    id: 'f1',
    nickname: 'Alice',
    online: true,
    hasStory: true,
    avatar: { kind: 'preset' as const, preset: 'blue' },
  },
  {
    id: 'f2',
    nickname: 'Bob',
    online: false,
    hasStory: false,
    avatar: { kind: 'none' as const, preset: null },
  },
  {
    id: 'f3',
    nickname: 'Cara',
    online: true,
    hasStory: false,
    avatar: { kind: 'upload' as const, preset: null },
  },
];

// ---- Tests ------------------------------------------------------------------

describe('FriendsBar', () => {
  it('renders the "+" add story button', () => {
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={vi.fn()} />);
    expect(screen.getByRole('button', { name: /share your story/i })).toBeInTheDocument();
  });

  it('calls onAddStory when the "+" button is clicked', async () => {
    const onAddStory = vi.fn();
    const user = userEvent.setup();
    render(<FriendsBar friends={FRIENDS} onAddStory={onAddStory} onOpenStory={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /share your story/i }));
    expect(onAddStory).toHaveBeenCalledOnce();
  });

  it('renders friend nickname accessible labels', () => {
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={vi.fn()} />);
    // Alice has a story — her aria-label is "Alice's story"
    expect(screen.getByRole('button', { name: /alice's story/i })).toBeInTheDocument();
    // Bob has no story — aria-label is just "Bob"
    expect(screen.getByLabelText('Bob')).toBeInTheDocument();
    // Cara has no story — aria-label is just "Cara"
    expect(screen.getByLabelText('Cara')).toBeInTheDocument();
  });

  it('shows online dot for online friends', () => {
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={vi.fn()} />);
    // Alice (online=true) and Cara (online=true) should each have a dot
    const dots = screen.getAllByTestId('online-dot');
    expect(dots).toHaveLength(2);
  });

  it('shows gradient story ring for friends with hasStory', () => {
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={vi.fn()} />);
    // Only Alice has hasStory=true
    const rings = screen.getAllByTestId('story-ring');
    expect(rings).toHaveLength(1);
  });

  it('does NOT show story ring for friends without a story', () => {
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={vi.fn()} />);
    // Only one ring exists (Alice); Bob and Cara should not have one
    expect(screen.getAllByTestId('story-ring')).toHaveLength(1);
    // Verify Bob and Cara are present without a ring by their label
    expect(screen.getByLabelText('Bob')).toBeInTheDocument();
    expect(screen.getByLabelText('Cara')).toBeInTheDocument();
  });

  it('calls onOpenStory with the correct friend when a story friend is clicked', async () => {
    const onOpenStory = vi.fn();
    const user = userEvent.setup();
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={onOpenStory} />);
    await user.click(screen.getByRole('button', { name: /alice's story/i }));
    expect(onOpenStory).toHaveBeenCalledOnce();
    expect(onOpenStory).toHaveBeenCalledWith(FRIENDS[0]);
  });

  it('does NOT call onOpenStory when clicking a no-story friend', async () => {
    const onOpenStory = vi.fn();
    const user = userEvent.setup();
    render(<FriendsBar friends={FRIENDS} onAddStory={vi.fn()} onOpenStory={onOpenStory} />);
    // Bob has no story; his wrapper has no role=button
    await user.click(screen.getByLabelText('Bob'));
    expect(onOpenStory).not.toHaveBeenCalled();
  });
});
