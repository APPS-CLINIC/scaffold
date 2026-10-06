import type { ComponentProps } from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import type { MultiSelectChangeEvent } from 'primereact/multiselect';
import { useLocation, useNavigationType } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTableSettingsState } from '@/features/tableSettings';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';
import { customerTableConfig } from './customerTable';

type MultiSelectProps = ComponentProps<typeof IwaComponents.MultiSelect>;
type DatePickerProps = ComponentProps<typeof IwaComponents.DatePicker>;
type ChipInputProps = ComponentProps<typeof IwaComponents.ChipInput>;

// Values are set and chips removed through the props handed to the library: the option
// panels, calendars and chip controls are vendor markup that differs between the test
// double and the real library. A multiselect is recorded by the label that names it, and
// the start of a date range by its input id, read from the range's own "From" label; chips
// are recorded by param.
const captured: {
  multiSelects: Record<string, MultiSelectProps>;
  datePickers: Record<string, DatePickerProps>;
  chips: Record<string, ChipInputProps>;
} = { multiSelects: {}, datePickers: {}, chips: {} };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    MultiSelect: (props: MultiSelectProps) => {
      const labelledBy = props['aria-labelledby'];
      if (labelledBy) captured.multiSelects[labelledBy] = props;
      return <actual.MultiSelect {...props} />;
    },
    DatePicker: (props: DatePickerProps) => {
      if (props.id) captured.datePickers[props.id] = props;
      return <actual.DatePicker {...props} />;
    },
    ChipInput: (props: ChipInputProps) => {
      const param: unknown = props.chips[0]?.value;
      if (typeof param === 'string') captured.chips[param] = props;
      return <actual.ChipInput {...props} />;
    },
  };
});

const appendToHead = document.head.appendChild.bind(document.head);
let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

function LocationProbe() {
  const { search } = useLocation();
  return (
    <output aria-label="Current customer URL" data-navigation-type={useNavigationType()}>
      {search}
    </output>
  );
}

function renderPage(initialEntry = '/customers/all', columns?: readonly string[]) {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
      <LocationProbe />
    </>,
    {
      initialEntries: [initialEntry],
      preloadedState: {
        tableSettings: createTableSettingsState(
          columns === undefined ? undefined : { version: 1, tables: { customers: { columns } } },
        ),
      },
    },
  );
}

const location = () => screen.getByRole('status', { name: 'Current customer URL' });
const currentSearch = () => new URLSearchParams(location().textContent ?? '');

/** The search params of the last customer list request. */
const lastListRequest = () => {
  const requests = fetchMock.mock.calls
    .map(([request]) => request)
    .filter(
      (request): request is Request =>
        request instanceof Request && new URL(request.url).pathname === '/api/customers',
    );
  const last = requests.at(-1);
  if (last === undefined) throw new Error('No customer list request was sent');
  return new URL(last.url).searchParams;
};

const label = (field: string) => {
  const config = customerTableConfig.fields.find((candidate) => candidate.field === field);
  if (config === undefined) throw new Error(`Unknown field ${field}`);
  return i18n.t(config.labelKey);
};

const filterDialog = () => screen.getByRole('dialog', { name: 'Customize filters' });
// The library's icon-text button has a custom role; its aria-label names it.
const filtersButton = () => screen.getByLabelText('Customize filters', { selector: 'button' });
const rowLabels = () =>
  Array.from(filterDialog().querySelectorAll('label:not(.sr-only)')).map(
    (element) => element.textContent,
  );
/** Each applied-filter list item holds exactly the given chip text, in order. */
function expectChips(texts: readonly string[]) {
  const items = Array.from(screen.getByRole('list', { name: 'Applied filters' }).children);
  expect(items).toHaveLength(texts.length);
  texts.forEach((text, index) => within(items[index] as HTMLElement).getByText(text));
}

function chip(param: string): ChipInputProps {
  const props = captured.chips[param];
  if (props === undefined) throw new Error(`No chip for ${param}`);
  return props;
}

/** The id of the field's row label, which names its control. */
const labelId = (field: string) =>
  within(filterDialog()).getByText(label(field), { selector: 'label' }).id;

function multiSelect(field: string): MultiSelectProps {
  const props = captured.multiSelects[labelId(field)];
  if (props === undefined) throw new Error(`No multiselect for ${field}`);
  return props;
}

/** The calendar of a date range's start. */
function dateFrom(field: string): DatePickerProps {
  const range = within(filterDialog()).getByRole('group', { name: label(field) });
  const fromId = within(range).getByText('From', { selector: 'label' }).getAttribute('for') ?? '';
  const props = captured.datePickers[fromId];
  if (props === undefined) throw new Error(`No date picker for ${field}`);
  return props;
}

beforeEach(async () => {
  captured.multiSelects = {};
  captured.datePickers = {};
  captured.chips = {};
  mockTableContainerWidth(1380);
  fetchMock = installCustomerApiTestTransport();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomersView filters', () => {
  it('offers a filter for every filterable column, in the order of the columns', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all', ['type', 'fullName', 'lendingRating', 'status', 'kkf']);
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(filtersButton());

    expect(rowLabels()).toEqual([label('type'), label('lendingRating'), label('status')]);
  });

  it('writes the saved filters to the URL, back on page 1, and sends them to the service', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all?page=2&sort=fullName', ['fullName', 'status', 'lendingReviewDate']);
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(filtersButton());
    act(() => {
      multiSelect('status').onChange?.({ value: ['ARCHIVAL'] } as MultiSelectChangeEvent);
    });
    act(() => dateFrom('lendingReviewDate').onChange(new Date(2026, 1, 1)));
    await user.click(within(filterDialog()).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('OZAROW CEMENT S.A.')).toBeInTheDocument();
    expect(currentSearch().getAll('status')).toEqual(['ARCHIVAL']);
    expect(currentSearch().get('lendingReviewDate.from')).toBe('2026-02-01');
    expect(currentSearch().has('lendingReviewDate.to')).toBe(false);
    expect(currentSearch().has('page')).toBe(false);
    expect(currentSearch().get('sort')).toBe('fullName');
    expect(location()).toHaveAttribute('data-navigation-type', 'PUSH');
    expect(lastListRequest().getAll('status')).toEqual(['ARCHIVAL']);
    expect(lastListRequest().get('lendingReviewDate.from')).toBe('2026-02-01');
    expect(lastListRequest().has('lendingReviewDate.to')).toBe(false);
  });

  it('shows the applied filters as chips and removes them one by one or all at once', async () => {
    const user = userEvent.setup();
    renderPage(
      '/customers/all?q=ozarow&rmAdvisor=rm-1&status=ARCHIVAL&lendingReviewDate.from=2026-02-01',
    );
    await screen.findByText('Clear filters (3)');

    expectChips([
      `${label('status')}: Archival`,
      `${label('lendingReviewDate')}: ${i18n.t('table.filters.range.from', {
        date: new Intl.DateTimeFormat('en', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(2026, 1, 1)),
      })}`,
      `${label('rmAdvisor')}: Kowalska Anna`,
    ]);

    act(() => chip('status').onChange([]));
    await waitFor(() => expect(currentSearch().has('status')).toBe(false));
    expect(currentSearch().get('rmAdvisor')).toBe('rm-1');

    await user.click(screen.getByText('Clear filters (2)'));
    await waitFor(() => expect(currentSearch().toString()).toBe('q=ozarow'));
    expect(screen.queryByRole('list', { name: 'Applied filters' })).toBeNull();
  });

  it('shows no chip for a value the request leaves out', async () => {
    renderPage(
      '/customers/all?status=archival&type=CORPORATE&lendingReviewDate.from=2026-1-5&lendingRating=%20%20',
    );
    await screen.findByText('Clear filters (1)');

    expectChips([`${label('type')}: Corporate`]);
    expect(lastListRequest().has('status')).toBe(false);
    expect(lastListRequest().has('lendingReviewDate.from')).toBe(false);
    expect(lastListRequest().has('lendingRating')).toBe(false);
  });

  it('neither shows nor applies the filter of a column the user removed, and drops it on save', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all?status=ARCHIVAL&type=CORPORATE', ['fullName', 'type']);
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    expectChips([`${label('type')}: Corporate`]);
    expect(lastListRequest().has('status')).toBe(false);
    expect(lastListRequest().getAll('type')).toEqual(['CORPORATE']);

    await user.click(filtersButton());
    expect(rowLabels()).not.toContain(label('status'));

    await user.click(within(filterDialog()).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(currentSearch().has('status')).toBe(false));
    expect(currentSearch().getAll('type')).toEqual(['CORPORATE']);
  });

  it('offers dictionary entries by name, with a choice for customers without an own group', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all', ['fullName', 'internalGroupName', 'rmAdvisor']);
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(filtersButton());
    await waitFor(() => expect(multiSelect('internalGroupName').options).toHaveLength(4));

    expect(multiSelect('internalGroupName').options?.[0]).toEqual({
      value: 'NONE',
      label: 'No own group',
    });
    expect(multiSelect('rmAdvisor').options).toContainEqual({
      value: 'rm-2',
      label: 'Nowak Piotr',
    });

    act(() => {
      multiSelect('rmAdvisor').onChange?.({ value: ['rm-2'] } as MultiSelectChangeEvent);
      multiSelect('internalGroupName').onChange?.({ value: ['NONE'] } as MultiSelectChangeEvent);
    });
    await user.click(within(filterDialog()).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(currentSearch().get('rmAdvisor')).toBe('rm-2'));
    expect(currentSearch().getAll('internalGroupId')).toEqual(['NONE']);
    expectChips([
      `${label('internalGroupName')}: No own group`,
      `${label('rmAdvisor')}: Nowak Piotr`,
    ]);
    await waitFor(() => expect(lastListRequest().getAll('rmAdvisor')).toEqual(['rm-2']));
    expect(lastListRequest().getAll('internalGroupId')).toEqual(['NONE']);
  });
});
