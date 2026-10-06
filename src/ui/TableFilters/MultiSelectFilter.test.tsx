import type { ComponentProps } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { MultiSelectChangeEvent } from 'primereact/multiselect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { MultiSelectFilter, type MultiSelectFilterProps } from './MultiSelectFilter';
import type { TableFilterOption, TableFilterValues } from './TableFilters.types';

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

beforeEach(() => {
  captured.multiSelect = null;
});

function multiSelectProps(): MultiSelectProps {
  if (captured.multiSelect === null) throw new Error('MultiSelect was not rendered');
  return captured.multiSelect;
}

const options: readonly TableFilterOption[] = [
  { value: 'ACTIVE', labelKey: 'common.status.active' },
  { value: '17', label: 'Grupa Północ' },
];

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

  it('offers the translated options and no search for a short list', () => {
    renderMultiSelect({ status: ['ACTIVE'], type: ['SME'] }, { selectionLimit: 100 });

    expect(multiSelectProps()).toMatchObject({
      inputId: 'status',
      'aria-labelledby': 'status-label',
      value: ['ACTIVE'],
      options: [
        { value: 'ACTIVE', label: i18n.t('common.status.active') },
        { value: '17', label: 'Grupa Północ' },
      ],
      optionLabel: 'label',
      optionValue: 'value',
      filter: false,
      showHeader: true,
      showSelectAll: false,
      selectionLimit: 100,
      placeholder: i18n.t('table.filters.placeholder'),
    });
  });

  it.each([
    [5, false],
    [6, true],
  ])('with %i options offers a search narrowing by contained text: %s', (count, search) => {
    const optionList = Array.from({ length: count }, (_, index) => ({
      value: String(index),
      label: `Option ${index}`,
    }));
    renderMultiSelect({}, { options: optionList });

    expect(multiSelectProps()).toMatchObject({ filter: search, filterMatchMode: 'contains' });
  });

  it('takes its accessible name from the row label', () => {
    render(
      <>
        <span id="status-label">Status</span>
        <MultiSelectFilter
          inputId="status"
          labelId="status-label"
          param="status"
          values={{}}
          onChange={vi.fn()}
          options={options}
        />
      </>,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
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
