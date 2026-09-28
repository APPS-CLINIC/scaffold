import { act, render, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DueDateFilter } from './DueDateFilter';

type ChipsProps = ComponentProps<typeof IwaComponents.Chips>;
type ChipsChipProps = ComponentProps<typeof IwaComponents.Chips.Chip>;

const { chipsSpy, chipSpy } = vi.hoisted(() => ({ chipsSpy: vi.fn(), chipSpy: vi.fn() }));

// The chosen chip and its selected look are IWA's own DOM, which this repo does not control,
// so the filter is checked by what it hands the Chips group.
vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  const Chips = Object.assign(
    (props: ChipsProps) => {
      chipsSpy(props);
      return <div>{props.children}</div>;
    },
    {
      Chip: (props: ChipsChipProps) => {
        chipSpy(props);
        return <span>{props.label}</span>;
      },
    },
  );

  return { ...actual, Chips };
});

const lastGroup = () => chipsSpy.mock.calls.at(-1)?.[0] as ChipsProps;
const lastChips = () =>
  (chipSpy.mock.calls.slice(-4) as [ChipsChipProps][]).map(([props]) => props);

beforeEach(async () => {
  chipsSpy.mockClear();
  chipSpy.mockClear();
  await i18n.changeLanguage('en');
});

describe('DueDateFilter', () => {
  it('offers the four windows in order and hands the chosen one to the group', () => {
    render(<DueDateFilter value="upTo30Days" onChange={vi.fn()} />);

    expect(lastChips().map((chip) => [chip.label, chip.value])).toEqual([
      ['All', 'all'],
      ['Up to 30 days', 'upTo30Days'],
      ['Over 30 days', 'over30Days'],
      ['Overdue', 'overdue'],
    ]);
    expect(lastGroup().value).toBe('upTo30Days');
    expect(lastGroup().multiple).toBeFalsy();
    expect(lastGroup().wrap).toBe(true);
  });

  it('names the group and the chosen filter for assistive technology', () => {
    render(<DueDateFilter value="overdue" onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Due date filter' });
    expect(group).toHaveTextContent('Selected filter: Overdue');
  });

  it('reports a newly picked window', () => {
    const onChange = vi.fn();
    render(<DueDateFilter value="all" onChange={onChange} />);

    act(() => lastGroup().onChange('overdue'));

    expect(onChange).toHaveBeenCalledWith('overdue');
  });

  it('ignores the chosen window again and anything that is not a window', () => {
    const onChange = vi.fn();
    render(<DueDateFilter value="all" onChange={onChange} />);

    act(() => {
      lastGroup().onChange('all');
      lastGroup().onChange(['overdue']);
      lastGroup().onChange('next-week');
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets the caller rename the group and style the container', () => {
    render(
      <DueDateFilter
        value="all"
        onChange={vi.fn()}
        aria-label="Review date filter"
        className="pt-5"
      />,
    );

    expect(screen.getByRole('group', { name: 'Review date filter' })).toHaveClass('pt-5');
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
