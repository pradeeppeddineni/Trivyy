import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTransition } from './PageTransition';

describe('PageTransition', () => {
  it('renders its children', () => {
    render(
      <PageTransition>
        <p>hello</p>
      </PageTransition>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
