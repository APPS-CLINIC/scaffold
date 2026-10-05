import type { ComponentProps } from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { MultiSelectChangeEvent } from 'primereact/multiselect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import { createMultiSelectFilter } from './createMultiSelectFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { MultiSelectFilter, type MultiSelectFilterProps } from './MultiSelectFilter';
import { TextFilter } from './TextFilter';
import type { TableFilterOption, TableFilterValues } from './TableFilters.types';

type MultiSelectProps = ComponentProps<typeof IwaComponents.MultiSelect>;
type DatePickerProps = ComponentProps<typeof IwaComponents.DatePicker>;

// The multiselect and the calendars are driven through the props handed to the library:
// their panels are vendor markup that differs between the test double and the real library.
const captured: {
  multiSelect: MultiSelectProps | null;
  datePickers: Record<string, DatePickerProps>;
} = { multiSelect: null, datePickers: {} };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    MultiSelect: (props: MultiSelectProps) => {
      captured.multiSelect = props;
      return <actual.MultiSelect {...props} />;
    },
    DatePicker: (props: DatePickerProps) => {
      if (props.id) captured.datePickers[props.id] = props;
      return <actual.DatePicker {...props} />;
    },
  };
});

beforeEach(() => {
  captured.multiSelect = null;
  captured.datePickers = {};
});

const options: readonly TableFilterOption[] = [
  { value: 'ACTIVE', labelKey: 'common.status.active' },
  { value: '17', label: 'Grupa Północ' },
];

function multiSelectProps(): MultiSelectProps {
  if (captured.multiSelect === null) throw new Error('MultiSelect was not rendered');
  return captured.multiSelect;
}

function datePickerProps(id: string): DatePickerProps {
  const props = captured.datePickers[id];
  if (props === undefined) throw new Error(`DatePicker ${id} was not rendered`);
  return props;
}

describe('MultiSelectFilter', () => {
  function renderMultiSelect(
    values: TableFilterValues,
    props: Partial<MultiSelectFilterProps> = {},
    onChange = vi.fn(),
  ) {
    render(
      <MultiSelectFilter
        inputId="status"
        labelId="status-label"
        param="status"
        values={values}
        onChange={onChange}
        options={options}
        {...props}
      />,
    );
    return onChange;
  }

  it('offers the translated options and narrows the list by contained text', () => {
    renderMultiSelect({ status: ['ACTIVE'], type: ['SME'] }, { selectionLimit: 100 });

    expect(multiSelectProps()).toMatchObject({
      inputId: 'status',
      value: ['ACTIVE'],
      options: [
        { value: 'ACTIVE', label: i18n.t('common.status.active') },
        { value: '17', label: 'Grupa Północ' },
      ],
      optionLabel: 'label',
      optionValue: 'value',
      filter: true,
      filterMatchMode: 'contains',
      showHeader: true,
      showSelectAll: false,
      selectionLimit: 100,
      placeholder: i18n.t('table.filters.placeholder'),
    });
  });

  it('shows only values that have an option', () => {
    renderMultiSelect({ status: ['GONE', '17'] });

    expect(multiSelectProps().value).toEqual(['17']);
  });

  it('reports the picked values as text', () => {
    const onChange = renderMultiSelect({});

    act(() => {
      multiSelectProps().onChange?.({ value: ['17', 3, 'ACTIVE'] } as MultiSelectChangeEvent);
    });

    expect(onChange).toHaveBeenCalledWith({ status: ['17', 'ACTIVE'] });
  });

  it('summarises the values by their labels and keeps an unknown value as it is', () => {
    const { result } = renderHook(() =>
      MultiSelectFilter.useSummary(
        { group: ['17', 'ACTIVE', 'GONE'] },
        { param: 'group', options },
      ),
    );

    expect(result.current).toBe(`Grupa Północ, ${i18n.t('common.status.active')}, GONE`);
  });
});

describe('createMultiSelectFilter', () => {
  interface TeamProps {
    city: string;
  }
  const useTeamOptions = ({ city }: TeamProps): readonly TableFilterOption[] => [
    { value: `${city}-1`, label: `Team ${city}` },
  ];
  const TeamFilter = createMultiSelectFilter(useTeamOptions, { selectionLimit: 100 });

  it('offers the options its hook returns for the declared props', () => {
    render(
      <TeamFilter
        inputId="team"
        labelId="team-label"
        param="teamId"
        values={{ teamId: ['waw-1'] }}
        onChange={vi.fn()}
        city="waw"
      />,
    );

    expect(multiSelectProps()).toMatchObject({
      inputId: 'team',
      value: ['waw-1'],
      options: [{ value: 'waw-1', label: 'Team waw' }],
      selectionLimit: 100,
    });
  });

  it('summarises the values with the same options', () => {
    const { result } = renderHook(() =>
      TeamFilter.useSummary({ teamId: ['waw-1', 'gone'] }, { param: 'teamId', city: 'waw' }),
    );

    expect(result.current).toBe('Team waw, gone');
  });
});

describe('DateRangeFilter', () => {
  function renderRange(values: TableFilterValues) {
    const onChange = vi.fn();
    const element = (current: TableFilterValues) => (
      <>
        <span id="review-label">Review</span>
        <DateRangeFilter
          inputId="review"
          labelId="review-label"
          param="reviewDate"
          values={current}
          onChange={onChange}
        />
      </>
    );
    const { rerender } = render(element(values));
    return { onChange, rerender: (next: TableFilterValues) => rerender(element(next)) };
  }

  it('shows both ends as local days and keeps each end on its side of the other', () => {
    renderRange({ 'reviewDate.from': ['2026-02-01'], 'reviewDate.to': ['2026-03-31'] });

    expect(screen.getByRole('group', { name: 'Review' })).toBeInTheDocument();
    const from = datePickerProps('review');
    const to = datePickerProps('review-to');
    expect(from.value).toEqual(new Date(2026, 1, 1));
    expect(from.maxDate).toEqual(new Date(2026, 2, 31));
    expect(to.value).toEqual(new Date(2026, 2, 31));
    expect(to.minDate).toEqual(new Date(2026, 1, 1));
  });

  it('opens both calendars on the document body, outside the scrolling dialog rows', () => {
    renderRange({});

    expect(datePickerProps('review').appendTo).toBe(document.body);
    expect(datePickerProps('review-to').appendTo).toBe(document.body);
  });

  it('writes a picked day as yyyy-MM-dd and leaves the other end as it was', () => {
    const { onChange } = renderRange({ 'reviewDate.to': ['2026-03-31'] });

    act(() => datePickerProps('review').onChange(new Date(2026, 0, 15, 23, 30)));

    expect(onChange).toHaveBeenLastCalledWith({
      'reviewDate.from': ['2026-01-15'],
      'reviewDate.to': ['2026-03-31'],
    });
  });

  it('clears either end on its own; with both ends empty there is no filter', () => {
    const { onChange, rerender } = renderRange({
      'reviewDate.from': ['2026-02-01'],
      'reviewDate.to': ['2026-03-31'],
    });

    act(() => datePickerProps('review').onChange(null));
    expect(onChange).toHaveBeenLastCalledWith({
      'reviewDate.from': [],
      'reviewDate.to': ['2026-03-31'],
    });

    rerender(onChange.mock.lastCall?.[0] as TableFilterValues);
    expect(datePickerProps('review').value).toBeNull();

    act(() => datePickerProps('review-to').onChange(null));
    expect(onChange).toHaveBeenLastCalledWith({ 'reviewDate.from': [], 'reviewDate.to': [] });
  });

  it('summarises the range in the active language', () => {
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const from = formatIsoDmyDate('2026-02-01', locale);
    const to = formatIsoDmyDate('2026-03-31', locale);
    const summary = (values: TableFilterValues) =>
      renderHook(() => DateRangeFilter.useSummary(values, { param: 'review' })).result.current;

    expect(summary({ 'review.from': ['2026-02-01'], 'review.to': ['2026-03-31'] })).toBe(
      i18n.t('table.filters.range.between', { from, to }),
    );
    expect(summary({ 'review.from': ['2026-02-01'] })).toBe(
      i18n.t('table.filters.range.from', { date: from }),
    );
    expect(summary({ 'review.to': ['2026-03-31'] })).toBe(
      i18n.t('table.filters.range.to', { date: to }),
    );
  });
});

describe('TextFilter', () => {
  it('reports the typed text and treats blank text as no filter', () => {
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="rating">Rating</label>
        <TextFilter
          inputId="rating"
          labelId="rating-label"
          param="lendingRating"
          values={{ lendingRating: ['BBB'] }}
          onChange={onChange}
        />
      </>,
    );
    const input = screen.getByLabelText('Rating');

    expect(input).toHaveValue('BBB');
    expect(input).toHaveAttribute('maxLength', '200');

    fireEvent.change(input, { target: { value: 'A A' } });
    expect(onChange).toHaveBeenLastCalledWith({ lendingRating: ['A A'] });

    fireEvent.change(input, { target: { value: '   ' } });
    expect(onChange).toHaveBeenLastCalledWith({ lendingRating: [] });
  });

  it('summarises the trimmed text', () => {
    const summary = (values: TableFilterValues) =>
      renderHook(() => TextFilter.useSummary(values, { param: 'rating' })).result.current;

    expect(summary({ rating: ['  BBB '] })).toBe('BBB');
    expect(summary({})).toBe('');
  });
});
