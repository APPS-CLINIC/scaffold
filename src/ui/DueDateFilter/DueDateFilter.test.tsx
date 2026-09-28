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
  it('offers All and the three windows as one multiple-choice group', () => {
    render(<DueDateFilter value={[]} onChange={vi.fn()} />);

    expect(lastChips().map((chip) => [chip.label, chip.value])).toEqual([
      ['All', 'all'],
      ['Up to 30 days', 'upTo30Days'],
      ['Over 30 days', 'over30Days'],
      ['Overdue', 'overdue'],
    ]);
    expect(lastGroup().multiple).toBe(true);
    expect(lastGroup().wrap).toBe(true);
  });

  it('marks All while no window is chosen and the windows once some are', () => {
    const { rerender } = render(<DueDateFilter value={[]} onChange={vi.fn()} />);
    expect(lastGroup().value).toEqual(['all']);

    rerender(<DueDateFilter value={['upTo30Days', 'overdue']} onChange={vi.fn()} />);
    expect(lastGroup().value).toEqual(['upTo30Days', 'overdue']);
  });

  it('names the group and the chosen filters for assistive technology', () => {
    const { rerender } = render(<DueDateFilter value={[]} onChange={vi.fn()} />);
    const group = screen.getByRole('group', { name: 'Due date filter' });
    expect(group).toHaveTextContent('Selected filters: All');

    rerender(<DueDateFilter value={['upTo30Days', 'overdue']} onChange={vi.fn()} />);
    expect(group).toHaveTextContent('Selected filters: Up to 30 days, Overdue');
  });

  it.each([
    ['a window picked while All is on replaces it', [], ['all', 'overdue'], ['overdue']],
    [
      'a second window joins the first',
      ['overdue'],
      ['overdue', 'upTo30Days'],
      ['upTo30Days', 'overdue'],
    ],
    [
      'All picked clears the windows',
      ['overdue', 'upTo30Days'],
      ['upTo30Days', 'overdue', 'all'],
      [],
    ],
    ['unselecting the last window brings All back', ['overdue'], [], []],
    [
      'unselecting one of two keeps the other',
      ['upTo30Days', 'overdue'],
      ['upTo30Days'],
      ['upTo30Days'],
    ],
  ] as const)('reports the new choice when %s', (_case, value, next, expected) => {
    const onChange = vi.fn();
    render(<DueDateFilter value={value} onChange={onChange} />);

    act(() => lastGroup().onChange([...next]));

    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('stays quiet when All is clicked again or the change is not a list', () => {
    const onChange = vi.fn();
    render(<DueDateFilter value={[]} onChange={onChange} />);

    act(() => {
      lastGroup().onChange([]);
      lastGroup().onChange(['all']);
      lastGroup().onChange('overdue');
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets the caller rename the group and style the container', () => {
    render(
      <DueDateFilter
        value={[]}
        onChange={vi.fn()}
        aria-label="Review date filter"
        className="pt-5"
      />,
    );

    expect(screen.getByRole('group', { name: 'Review date filter' })).toHaveClass('pt-5');
  });

  it('words the chips in Polish', async () => {
    await i18n.changeLanguage('pl');
    render(<DueDateFilter value={[]} onChange={vi.fn()} />);

    expect(lastChips().map((chip) => chip.label)).toEqual([
      'Wszystkie',
      'Do 30 dni',
      'Powyżej 30 dni',
      'Zaległe',
    ]);
  });
});
