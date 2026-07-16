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
  it('renders the bound glyph inside a circular container', () => {
    const { result } = setup();
    const HistoryIcon = result.current;

    render(<HistoryIcon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toContainElement(screen.getByTestId('glyph'));
    expect(icon.className).toContain('rounded-full');
    expect(icon.className).toContain('items-center');
    expect(icon.className).toContain('justify-center');
  });

  it('applies the default styles (md size, outline tone) when no options are given', () => {
    const { result } = setup();
    const HistoryIcon = result.current;

    render(<HistoryIcon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon.className).toContain('size-9');
    expect(icon.className).toContain('border');
    expect(icon.className).toContain('bg-[var(--surface)]');
  });

  it('is decorative (hidden from assistive tech) by default', () => {
    const { result } = setup();
    const HistoryIcon = result.current;

    render(<HistoryIcon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
  });

  it('exposes an accessible name when `label` is given', () => {
    const { result } = setup({ label: 'Change history' });
    const HistoryIcon = result.current;

    render(<HistoryIcon />);
    const icon = screen.getByRole('img', { name: 'Change history' });
    expect(icon).not.toHaveAttribute('aria-hidden');
  });

  it('applies option defaults and lets per-usage props override them', () => {
    const { result } = setup({ size: 'lg', tone: 'accent', label: 'History' });
    const HistoryIcon = result.current;

    const { rerender } = render(<HistoryIcon data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    expect(icon.className).toContain('size-12');
    expect(icon.className).toContain('bg-[var(--accent)]');
    expect(icon).toHaveAttribute('aria-label', 'History');

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
    expect(icon.className).toContain('rounded-full');
  });

  it('keeps a stable component identity across re-renders with the same inputs', () => {
    const options: UseCustomIconOptions = { size: 'md' };
    const { result, rerender } = setup(options);
    const first = result.current;

    rerender({ options });
    expect(result.current).toBe(first);
  });
});
