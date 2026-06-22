import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryIcon, CATEGORY_COLORS } from './CategoryIcon';

const KNOWN_SLUGS = ['science', 'geography', 'movies', 'music', 'history', 'tech', 'any'] as const;

describe('CategoryIcon', () => {
  it.each(KNOWN_SLUGS)('renders an svg for slug "%s"', (slug) => {
    const { container } = render(<CategoryIcon slug={slug} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders a default svg for an unknown slug', () => {
    const { container } = render(<CategoryIcon slug="unknown-category" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies the given size to the svg', () => {
    const { container } = render(<CategoryIcon slug="science" size={32} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.style.width).toBe('32px');
    expect(svg.style.height).toBe('32px');
  });

  it('defaults to size 24 when size is omitted', () => {
    const { container } = render(<CategoryIcon slug="tech" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.style.width).toBe('24px');
    expect(svg.style.height).toBe('24px');
  });

  it('marks the svg as aria-hidden', () => {
    const { container } = render(<CategoryIcon slug="music" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('exports a color for each known slug', () => {
    for (const slug of KNOWN_SLUGS) {
      expect(CATEGORY_COLORS[slug]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
