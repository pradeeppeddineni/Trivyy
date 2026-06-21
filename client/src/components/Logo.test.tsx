import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('renders the Trivyy "T" mark', () => {
    render(<Logo />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('scales the glyph with the size prop', () => {
    const { container } = render(<Logo size={100} />);
    const glyph = screen.getByText('T');
    expect(glyph).toHaveStyle({ fontSize: '56px' }); // round(100 * 0.56)
    // The wrapper is decorative.
    expect(container.querySelector('[aria-hidden]')).not.toBeNull();
  });
});
