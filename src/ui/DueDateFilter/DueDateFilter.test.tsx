import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import type { ChipProps } from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DueDateFilter } from './DueDateFilter';

const { chipSpy } = vi.hoisted(() => ({ chipSpy: vi.fn() }));

// The chips' selected and check-mark state are props IWA renders in its own DOM, which this
// repo does not control, so they are asserted where they cross into the library.
vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();

  return {
    ...actual,
    Chip: (props: ChipProps) => {
      chipSpy(props);
      return <actual.Chip {...props} />;
    },
  };
});

/** The props of the four chips from the latest render, in render order. */
const lastChips = () => (chipSpy.mock.calls.slice(-4) as [ChipProps][]).map(([props]) => props);

beforeEach(async () => {
  chipSpy.mockClear();
  await i18n.changeLanguage('en');
});

describe('DueDateFilter', () => {
  it('offers the four windows in order and marks only the chosen one', () => {
    render(<DueDateFilter value="upTo30Days" onChange={vi.fn()} />);

    expect(lastChips().map((chip) => chip.label)).toEqual([
      'All',
      'Up to 30 days',
      'Over 30 days',
      'Overdue',
    ]);
    expect(lastChips().map((chip) => chip.selected)).toEqual([false, true, false, false]);
    expect(lastChips().every((chip) => chip.showSelection)).toBe(true);
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

    await user.click(screen.getByText('Overdue'));

    expect(onChange).toHaveBeenCalledWith('overdue');
  });

  it('stays quiet when the chosen window is picked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DueDateFilter value="all" onChange={onChange} />);

    await user.click(screen.getByText('All'));

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

    expect(lastChips().map((chip) => chip.label)).toEqual([
      'Wszystkie',
      'Do 30 dni',
      'Powyżej 30 dni',
      'Zaległe',
    ]);
  });
});
