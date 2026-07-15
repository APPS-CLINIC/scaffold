import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

const Glyph = () => (
  <svg data-testid="glyph" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" />
  </svg>
);

describe('Icon', () => {
  it('renders the glyph inside a circular container', () => {
    render(
      <Icon data-testid="icon">
        <Glyph />
      </Icon>,
    );
    const icon = screen.getByTestId('icon');
    expect(icon).toContainElement(screen.getByTestId('glyph'));
    expect(icon.className).toContain('rounded-full');
    expect(icon.className).toContain('items-center');
    expect(icon.className).toContain('justify-center');
  });

  it('is decorative (hidden from assistive tech) by default', () => {
    render(<Icon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
  });

  it('exposes an accessible name when `label` is given', () => {
    render(<Icon label="Historia zmian" />);
    const icon = screen.getByRole('img', { name: 'Historia zmian' });
    expect(icon).not.toHaveAttribute('aria-hidden');
  });

  it('applies size and tone classes, defaulting to md/outline', () => {
    const { rerender } = render(<Icon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon.className).toContain('size-9');
    expect(icon.className).toContain('border');

    rerender(<Icon data-testid="icon" size="lg" tone="accent" />);
    expect(icon.className).toContain('size-12');
    expect(icon.className).toContain('bg-[var(--accent)]');
  });

  it('merges a custom className with its own classes', () => {
    render(<Icon data-testid="icon" className="text-orange-600" />);
    const icon = screen.getByTestId('icon');
    expect(icon.className).toContain('text-orange-600');
    expect(icon.className).toContain('rounded-full');
  });
});
