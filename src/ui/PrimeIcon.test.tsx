import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrimeIcon } from './PrimeIcon';
import { createPrimeIcon } from './createPrimeIcon';

describe('PrimeIcon', () => {
  it('renders a decorative configured glyph and merges caller classes', () => {
    const { container } = render(<PrimeIcon name="building" className="text-accent" />);
    const icon = container.querySelector('.pi-building');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('text-accent');
  });

  it('supports an accessible name and config-driven component factory', () => {
    const CustomersIcon = createPrimeIcon('users');
    render(<CustomersIcon aria-label="Customers" />);

    expect(screen.getByRole('img', { name: 'Customers' })).toHaveClass('pi-users');
  });
});
