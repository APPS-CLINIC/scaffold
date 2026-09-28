import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DueDateFilter } from './DueDateFilter';

const chips = () => within(screen.getByRole('group')).getAllByRole('button');

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('DueDateFilter', () => {
  it('offers the four windows in order and marks only the chosen one', () => {
    render(<DueDateFilter value="upTo30Days" onChange={vi.fn()} />);

    expect(chips().map((chip) => chip.textContent)).toEqual([
      'All',
      'Up to 30 days',
      'Over 30 days',
      'Overdue',
    ]);
    expect(chips().map((chip) => chip.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);
    expect(
      screen.getByRole('button', { name: 'Up to 30 days', pressed: true }).querySelector('svg'),
    ).toBeInTheDocument();
  });

  it('names the group and the chosen filter for assistive technology', () => {
    render(<DueDateFilter value="overdue" onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Due date filter' });
    expect(group).toHaveTextContent('Selected filter: Overdue');
  });

  it('reports a newly picked window', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DueDateFilter value="all" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Overdue' }));

    expect(onChange).toHaveBeenCalledWith('overdue');
  });

  it('stays quiet when the chosen window is picked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DueDateFilter value="all" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets the caller rename the group and style the container', () => {
    render(
      <DueDateFilter
        value="all"
        onChange={vi.fn()}
        aria-label="Review date filter"
        className="mt-5"
      />,
    );

    expect(screen.getByRole('group', { name: 'Review date filter' })).toHaveClass('mt-5', 'flex');
  });

  it('words the chips in Polish', async () => {
    await i18n.changeLanguage('pl');
    render(<DueDateFilter value="all" onChange={vi.fn()} />);

    expect(chips().map((chip) => chip.textContent)).toEqual([
      'Wszystkie',
      'Do 30 dni',
      'Powyżej 30 dni',
      'Zaległe',
    ]);
  });
});
