import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Podium } from './Podium';

const ENTRIES = [
  { name: 'Alice', score: 9, total: 10 },
  { name: 'Bob', score: 7, total: 10 },
  { name: 'Cara', score: 5, total: 10 },
];

describe('Podium', () => {
  it('renders all entry names', () => {
    render(<Podium entries={ENTRIES} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Cara')).toBeInTheDocument();
  });

  it('renders scores for all entries', () => {
    render(<Podium entries={ENTRIES} />);
    // Scores appear as "score/total" — check at least "9/10", "7/10", "5/10"
    expect(screen.getByText('9/10')).toBeInTheDocument();
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('renders the crown icon for 1st place', () => {
    render(<Podium entries={ENTRIES} />);
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('renders only one crown', () => {
    render(<Podium entries={ENTRIES} />);
    const crowns = screen.getAllByTestId('crown-icon');
    expect(crowns).toHaveLength(1);
  });

  it('renders with a single entry (1st only)', () => {
    render(<Podium entries={[{ name: 'Solo', score: 10, total: 10 }]} />);
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('renders with two entries', () => {
    render(<Podium entries={[ENTRIES[0], ENTRIES[1]]} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Cara')).not.toBeInTheDocument();
  });

  it('renders avatar initials', () => {
    render(<Podium entries={ENTRIES} />);
    // Each player's initial should appear in an avatar circle
    const initials = screen.getAllByText('A');
    expect(initials.length).toBeGreaterThanOrEqual(1);
    const bobInitial = screen.getAllByText('B');
    expect(bobInitial.length).toBeGreaterThanOrEqual(1);
  });

  it('renders avatarSrc image when provided', () => {
    const entries = [
      { name: 'Alice', score: 9, total: 10, avatarSrc: 'https://example.com/alice.jpg' },
    ];
    render(<Podium entries={entries} />);
    expect(screen.getByAltText("Alice's avatar")).toBeInTheDocument();
  });

  it('renders score without total when total is undefined', () => {
    render(<Podium entries={[{ name: 'Solo', score: 8 }]} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
