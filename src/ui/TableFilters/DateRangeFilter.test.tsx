import type { ComponentProps } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import { DateRangeFilter } from './DateRangeFilter';
import type { TableFilterValues } from './TableFilters.types';

type DatePickerProps = ComponentProps<typeof IwaComponents.DatePicker>;

// The calendars are driven through the props handed to the library: their panels are vendor
// markup that differs between the test double and the real library.
const captured: { datePickers: Record<string, DatePickerProps> } = { datePickers: {} };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    DatePicker: (props: DatePickerProps) => {
      if (props.id) captured.datePickers[props.id] = props;
      return <actual.DatePicker {...props} />;
    },
  };
});

beforeEach(() => {
  captured.datePickers = {};
});

function datePickerProps(id: string): DatePickerProps {
  const props = captured.datePickers[id];
  if (props === undefined) throw new Error(`DatePicker ${id} was not rendered`);
  return props;
}

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
