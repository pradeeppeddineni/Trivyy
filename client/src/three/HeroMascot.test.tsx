/**
 * HeroMascot — unit tests (jsdom, no WebGL).
 *
 * jsdom does not implement WebGL, so hasWebGL() returns false and the wrapper
 * renders the StaticFallback immediately. Scene.tsx / Mascot.tsx are never
 * imported or mounted here.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroMascot, StaticFallback } from './HeroMascot';

// ── StaticFallback ────────────────────────────────────────────────────────────

describe('StaticFallback', () => {
  it('renders without throwing', () => {
    expect(() => render(<StaticFallback />)).not.toThrow();
  });

  it('has an accessible img role', () => {
    render(<StaticFallback />);
    expect(screen.getByRole('img', { name: /trivyy mascot/i })).toBeInTheDocument();
  });

  it('renders an SVG element', () => {
    const { container } = render(<StaticFallback />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('respects the size prop (hero default: 220)', () => {
    const { container } = render(<StaticFallback />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('220');
    expect(svg.getAttribute('height')).toBe('220');
  });

  it('respects the compact variant default size (120)', () => {
    const { container } = render(<StaticFallback variant="compact" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('120');
  });

  it('respects an explicit size override', () => {
    const { container } = render(<StaticFallback size={160} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('160');
  });
});

// ── HeroMascot (wrapper — jsdom always hits StaticFallback path) ──────────────

describe('HeroMascot', () => {
  it('renders without throwing in jsdom (no WebGL)', () => {
    expect(() => render(<HeroMascot />)).not.toThrow();
  });

  it('renders the static fallback img role in jsdom (WebGL unavailable)', () => {
    render(<HeroMascot />);
    expect(screen.getByRole('img', { name: /trivyy mascot/i })).toBeInTheDocument();
  });

  it('renders with variant="compact" without throwing', () => {
    expect(() => render(<HeroMascot variant="compact" />)).not.toThrow();
  });

  it('does NOT import or render a Canvas in jsdom', () => {
    const { container } = render(<HeroMascot />);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
