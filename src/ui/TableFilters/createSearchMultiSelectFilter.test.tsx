import type { ComponentProps } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { MultiSelectFilterEvent } from 'primereact/multiselect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { createSearchMultiSelectFilter } from './createSearchMultiSelectFilter';
import type { FilterOptionSearch, LoadedFilterOptions } from './TableFilters.types';

type MultiSelectProps = ComponentProps<typeof IwaComponents.MultiSelect>;

// The multiselect is driven through the props handed to the library: its panel is vendor
// markup that differs between the test double and the real library.
const captured: { multiSelect: MultiSelectProps | null } = { multiSelect: null };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    MultiSelect: (props: MultiSelectProps) => {
      captured.multiSelect = props;
      return <actual.MultiSelect {...props} />;
    },
  };
});

function multiSelectProps(): MultiSelectProps {
  if (captured.multiSelect === null) throw new Error('MultiSelect was not rendered');
  return captured.multiSelect;
}

interface GroupProps {
  list: string;
}

const searches: { props: GroupProps; search: FilterOptionSearch }[] = [];

function useGroupOptions(props: GroupProps, search: FilterOptionSearch): LoadedFilterOptions {
  searches.push({ props, search });
  return {
    options: [
      ...search.values.map((value) => ({ value, label: `Picked ${value}` })),
      ...(search.text ? [{ value: '7', label: `Found by ${search.text}` }] : []),
    ],
    loading: search.text === 'slow',
    failed: false,
  };
}

const GroupFilter = createSearchMultiSelectFilter(useGroupOptions, { selectionLimit: 100 });

const lastSearch = () => searches.at(-1)?.search;

function type(text: string) {
  act(() => {
    multiSelectProps().onFilter?.({ filter: text } as MultiSelectFilterEvent);
  });
}

beforeEach(() => {
  captured.multiSelect = null;
  searches.length = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSearchMultiSelectFilter', () => {
  function renderGroupFilter() {
    render(
      <GroupFilter
        inputId="group"
        labelId="group-label"
        param="groupId"
        values={{ groupId: ['3'] }}
        onChange={vi.fn()}
        list="corporate"
      />,
    );
  }

  it('asks its hook for the picked values before anything is typed', () => {
    renderGroupFilter();

    expect(searches[0]).toEqual({
      props: expect.objectContaining({ list: 'corporate' }),
      search: { text: '', values: ['3'] },
    });
    expect(multiSelectProps()).toMatchObject({
      value: ['3'],
      options: [{ value: '3', label: 'Picked 3' }],
      filter: true,
      filterPlaceholder: i18n.t('table.filters.searchMinLength', { count: 3 }),
      selectionLimit: 100,
    });
  });

  it('searches the trimmed text once typing pauses, from three characters on', () => {
    renderGroupFilter();

    type('ab');
    act(() => vi.advanceTimersByTime(1000));
    expect(lastSearch()?.text).toBe('');

    type(' abc ');
    act(() => vi.advanceTimersByTime(299));
    expect(lastSearch()?.text).toBe('');
    act(() => vi.advanceTimersByTime(1));
    expect(lastSearch()?.text).toBe('abc');
    expect(multiSelectProps().options).toContainEqual({ value: '7', label: 'Found by abc' });
  });

  it('passes on that the search is on its way', () => {
    renderGroupFilter();

    type('slow');
    act(() => vi.advanceTimersByTime(300));

    expect(multiSelectProps()).toMatchObject({
      loading: true,
      emptyFilterMessage: i18n.t('table.filters.loading'),
    });
  });

  it('counts the search as on its way while typing pauses, and asks for more below three characters', () => {
    renderGroupFilter();

    type('ab');
    expect(multiSelectProps()).toMatchObject({
      loading: false,
      emptyFilterMessage: i18n.t('table.filters.searchMinLength', { count: 3 }),
    });

    type('abc');
    expect(multiSelectProps()).toMatchObject({
      loading: true,
      emptyFilterMessage: i18n.t('table.filters.loading'),
    });
    act(() => vi.advanceTimersByTime(300));
    expect(multiSelectProps().loading).toBe(false);
  });

  it('summarises the values with the hook, without a search', () => {
    const { result } = renderHook(() =>
      GroupFilter.useSummary({ groupId: ['3', '4'] }, { param: 'groupId', list: 'corporate' }),
    );

    expect(lastSearch()).toEqual({ text: '', values: ['3', '4'] });
    expect(result.current).toBe('Picked 3, Picked 4');
  });
});
