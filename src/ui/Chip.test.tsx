import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('is a toggle button that reports whether it is selected', () => {
    render(
      <>
        <Chip label="Overdue" selected />
        <Chip label="All" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Overdue', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All', pressed: false })).toBeInTheDocument();
  });

  it('shows the check mark only on a selected chip that asks for it', () => {
    render(
      <>
        <Chip label="Selected with mark" selected showSelection />
        <Chip label="Selected without mark" selected />
        <Chip label="Unselected" showSelection />
      </>,
    );

    const mark = (name: string) => screen.getByRole('button', { name }).querySelector('svg');
    expect(mark('Selected with mark')).toBeInTheDocument();
    expect(mark('Selected without mark')).toBeNull();
    expect(mark('Unselected')).toBeNull();
  });

  it('reports a click unless it is disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDisabledClick = vi.fn();
    render(
      <>
        <Chip label="Active" onClick={onClick} />
        <Chip label="Disabled" disabled onClick={onDisabledClick} />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Active' }));
    await user.click(screen.getByRole('button', { name: 'Disabled' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDisabledClick).not.toHaveBeenCalled();
  });

  it('merges the caller class last, keeps the test id and forwards the ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Chip ref={ref} label="Wide" className="px-5" dataTestId="wide-chip" />);

    const chip = screen.getByTestId('wide-chip');
    expect(chip.className.split(' ').at(-1)).toBe('px-5');
    expect(ref.current).toBe(chip);
  });
});
