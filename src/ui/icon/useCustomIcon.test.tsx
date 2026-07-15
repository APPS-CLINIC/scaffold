import { describe, expect, it } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { useCustomIcon, type UseCustomIconOptions } from './useCustomIcon';

const glyph = (
  <svg data-testid="glyph" viewBox="0 0 16 16">
    <path d="M2 8a6 6 0 1 1 2 4.5" />
  </svg>
);

function setup(options?: UseCustomIconOptions) {
  return renderHook(
    (props: { options?: UseCustomIconOptions }) => useCustomIcon(glyph, props.options),
    {
      initialProps: { options },
    },
  );
}

describe('useCustomIcon', () => {
  it('returns a component that renders the bound glyph in a circle', () => {
    const { result } = setup();
    const HistoryIcon = result.current;

    render(<HistoryIcon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toContainElement(screen.getByTestId('glyph'));
    expect(icon.className).toContain('rounded-full');
  });

  it('applies option defaults and lets per-usage props override them', () => {
    const { result } = setup({ size: 'lg', tone: 'accent', label: 'Historia' });
    const HistoryIcon = result.current;

    const { rerender } = render(<HistoryIcon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon.className).toContain('size-12');
    expect(icon.className).toContain('bg-[var(--accent)]');
    expect(icon).toHaveAttribute('aria-label', 'Historia');

    rerender(<HistoryIcon data-testid="icon" size="sm" tone="neutral" />);
    expect(icon.className).toContain('size-6');
    expect(icon.className).toContain('bg-[var(--surface-muted)]');
  });

  it('merges the option className with the per-usage className', () => {
    const { result } = setup({ className: 'text-orange-600' });
    const HistoryIcon = result.current;

    render(<HistoryIcon data-testid="icon" className="shadow" />);
    const icon = screen.getByTestId('icon');
    expect(icon.className).toContain('text-orange-600');
    expect(icon.className).toContain('shadow');
  });

  it('keeps a stable component identity across re-renders with the same inputs', () => {
    const options: UseCustomIconOptions = { size: 'md' };
    const { result, rerender } = setup(options);
    const first = result.current;

    rerender({ options });
    expect(result.current).toBe(first);
  });
});
