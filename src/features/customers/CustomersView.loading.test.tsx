import type { ComponentProps } from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import {
  holdCustomerListResponses,
  installCustomerApiTestTransport,
} from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth, paginatorControl } from '@/test/tableLayout';
import { customerTableConfig } from './customerTable';
import { CustomersView } from './CustomersView';

type SnackbarProps = ComponentProps<typeof IwaComponents.Snackbar>;
type ChipInputProps = ComponentProps<typeof IwaComponents.ChipInput>;
type MultiSelectProps = ComponentProps<typeof IwaComponents.MultiSelect>;

// The snackbar, the chips and the multiselects are checked through the props handed to the
// library: their markup is vendor markup that differs between the test double and the real
// library. The notice inside the snackbar is ours.
const captured: {
  snackbar: SnackbarProps | null;
  chips: Record<string, ChipInputProps>;
  multiSelects: Record<string, MultiSelectProps>;
} = { snackbar: null, chips: {}, multiSelects: {} };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    Snackbar: (props: SnackbarProps) => {
      captured.snackbar = props;
      return <actual.Snackbar {...props} />;
    },
    ChipInput: (props: ChipInputProps) => {
      const param: unknown = props.chips[0]?.value;
      if (typeof param === 'string') captured.chips[param] = props;
      return <actual.ChipInput {...props} />;
    },
    MultiSelect: (props: MultiSelectProps) => {
      const labelledBy = props['aria-labelledby'];
      if (labelledBy) captured.multiSelects[labelledBy] = props;
      return <actual.MultiSelect {...props} />;
    },
  };
});

const appendToHead = document.head.appendChild.bind(document.head);
let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

function LocationProbe() {
  return <output aria-label="Current customer URL">{useLocation().search}</output>;
}

function renderPage(initialEntry = '/customers/all') {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
      <LocationProbe />
    </>,
    { initialEntries: [initialEntry] },
  );
}

/** Jumps the clock, letting the requests and the answers that fall due run as well. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const currentSearch = () =>
  new URLSearchParams(screen.getByRole('status', { name: 'Current customer URL' }).textContent);

const listRequestCount = () =>
  fetchMock.mock.calls
    .map(([request]) => request)
    .filter((request): request is Request => request instanceof Request)
    .filter((request) => new URL(request.url).pathname === '/api/v1/customers').length;

const searchField = () => screen.getByPlaceholderText('Search the list');
const notice = (name: string) => screen.queryByRole('button', { name });

/** Types into the search and lets the 300 ms pause pass, which sends the search. */
async function search(text: string) {
  fireEvent.change(searchField(), { target: { value: text } });
  await advance(300);
}

function chip(param: string): ChipInputProps {
  const props = captured.chips[param];
  if (props === undefined) throw new Error(`No chip for ${param}`);
  return props;
}

function multiSelectValue(field: string): unknown {
  const config = customerTableConfig.fields.find((entry) => entry.field === field);
  if (config === undefined) throw new Error(`No customer field ${field}`);
  const dialog = screen.getByRole('dialog', { name: 'Customize filters' });
  const label = within(dialog).getByText(i18n.t(config.labelKey), { selector: 'label' });
  return captured.multiSelects[label.id]?.value;
}

beforeEach(async () => {
  captured.snackbar = null;
  captured.chips = {};
  captured.multiSelects = {};
  // Time runs on its own, so the library's and the testing library's waits still pass; the
  // test jumps it forward to reach the loading thresholds.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockTableContainerWidth(1380);
  fetchMock = installCustomerApiTestTransport();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CustomersView while the list loads', () => {
  it('swaps the list without any loading state when the answer is quick', async () => {
    renderPage();
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();

    await search('carrefour');

    expect(await screen.findByText('CARREFOUR POLAND SP. Z O.O.')).toBeInTheDocument();
    expect(captured.snackbar?.visibility).toBe(false);
  });

  it('shows skeleton rows and the notice after 300 ms, and says so once it takes 10 s', async () => {
    renderPage();
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    holdCustomerListResponses();

    await search('carrefour');
    // Not yet: a quick answer would swap the rows without a flash.
    expect(screen.getByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();

    await advance(300);

    expect(screen.queryByText('ARCELORMITTAL WARSAW SP. Z O.O.')).not.toBeInTheDocument();
    expect(screen.getByText('Loading the customer list')).toBeInTheDocument();
    expect(captured.snackbar).toMatchObject({ visibility: true, type: 'default', closable: false });
    // The filters and the search stay while only the table loads.
    expect(searchField()).toHaveValue('carrefour');

    await advance(10_000);

    expect(
      screen.getByText(
        'Loading the customer list seems to be taking longer than usual. Please wait a moment',
      ),
    ).toBeInTheDocument();
  });

  it('goes back to the earlier list and keeps the typed search when the search is called off', async () => {
    renderPage();
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    const { release } = holdCustomerListResponses();
    await search('carrefour');
    await advance(300);
    const requestsBefore = listRequestCount();

    fireEvent.click(notice('Cancel and go back to the search') as HTMLElement);
    await advance(500);

    expect(screen.getByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    expect(currentSearch().has('q')).toBe(false);
    expect(searchField()).toHaveValue('carrefour');
    expect(searchField()).toHaveFocus();
    expect(captured.snackbar?.visibility).toBe(false);

    release();
    await advance(300);
    expect(listRequestCount()).toBe(requestsBefore);
    expect(screen.queryByText('CARREFOUR POLAND SP. Z O.O.')).not.toBeInTheDocument();
  });

  it('goes back to the earlier list and opens the chosen filters when filtering is called off', async () => {
    renderPage('/customers/all?status=ARCHIVAL&type=CORPORATE');
    expect(await screen.findByText('OZAROW CEMENT S.A.')).toBeInTheDocument();
    holdCustomerListResponses();

    act(() => chip('status').onChange([]));
    await advance(300);
    fireEvent.click(notice('Cancel and go back to the filters') as HTMLElement);
    await advance(500);

    expect(screen.getByText('OZAROW CEMENT S.A.')).toBeInTheDocument();
    expect(currentSearch().getAll('status')).toEqual(['ARCHIVAL']);
    await waitFor(() => expect(multiSelectValue('type')).toEqual(['CORPORATE']));
    expect(multiSelectValue('status')).toEqual([]);
  });

  it('goes back to the earlier page, without a request even after a minute, when paging is called off', async () => {
    renderPage();
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    holdCustomerListResponses();

    fireEvent.click(paginatorControl('next'));
    // Longer than the cache keeps a list nobody shows.
    await advance(61_000);
    expect(currentSearch().get('page')).toBe('2');
    const requestsBefore = listRequestCount();
    fireEvent.click(notice('Cancel') as HTMLElement);
    await advance(500);

    expect(screen.getByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    expect(currentSearch().has('page')).toBe(false);
    expect(listRequestCount()).toBe(requestsBefore);
  });

  it('keeps the list on screen when a refresh is called off', async () => {
    renderPage();
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    holdCustomerListResponses();
    const requestsBefore = listRequestCount();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await advance(300);
    expect(listRequestCount()).toBe(requestsBefore + 1);
    fireEvent.click(notice('Cancel') as HTMLElement);
    await advance(500);

    expect(screen.getByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    expect(listRequestCount()).toBe(requestsBefore + 1);
  });

  it('keeps the notice as it was while it outlasts a load that just ended', async () => {
    const { release } = holdCustomerListResponses();
    renderPage();
    await advance(300);
    expect(notice('Cancel and try again')).toBeInTheDocument();

    release();
    await advance(100);

    expect(notice('Cancel and try again')).toBeInTheDocument();
    expect(notice('Cancel')).not.toBeInTheDocument();

    await advance(400);

    expect(screen.getByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    expect(captured.snackbar?.visibility).toBe(false);
  });

  it('shows the whole view as a skeleton on the first load and sends it again on request', async () => {
    const { release } = holdCustomerListResponses();
    renderPage();
    await advance(0);

    expect(screen.queryByPlaceholderText('Search the list')).not.toBeInTheDocument();
    expect(notice('Cancel and try again')).not.toBeInTheDocument();
    const requestsBefore = listRequestCount();

    await advance(300);
    fireEvent.click(notice('Cancel and try again') as HTMLElement);
    await advance(0);
    expect(listRequestCount()).toBe(requestsBefore + 1);

    release();
    expect(await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.')).toBeInTheDocument();
    expect(searchField()).toBeInTheDocument();
  });
});
