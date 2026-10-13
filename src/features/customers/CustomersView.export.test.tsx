import type { ComponentProps } from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as baseApiModule from '@/api/baseApi';
import { createTableSettingsState } from '@/features/tableSettings';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';

type RadioGroupProps = ComponentProps<typeof IwaComponents.RadioGroup>;
type SnackbarProps = ComponentProps<typeof IwaComponents.Snackbar>;

// The radio group and the snackbar are checked through the props handed to the library: their
// markup is vendor markup that differs between the test double and the real library.
const captured: { radioGroup: RadioGroupProps | null; snackbar: SnackbarProps | null } = {
  radioGroup: null,
  snackbar: null,
};

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    RadioGroup: (props: RadioGroupProps) => {
      captured.radioGroup = props;
      return <actual.RadioGroup {...props} />;
    },
    Snackbar: (props: SnackbarProps) => {
      captured.snackbar = props;
      return <actual.Snackbar {...props} />;
    },
  };
});

const appendToHead = document.head.appendChild.bind(document.head);
let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

function renderPage(initialEntry = '/customers/all', columns?: readonly string[]) {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
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

const exportButton = () => screen.getByRole('button', { name: 'Download to Excel' });
const exportDialog = () =>
  screen.getByRole('dialog', { name: 'You are downloading the customer list' });

function radioGroup(): RadioGroupProps {
  if (captured.radioGroup === null) throw new Error('RadioGroup was not rendered');
  return captured.radioGroup;
}

function snackbar(): SnackbarProps {
  if (captured.snackbar === null) throw new Error('Snackbar was not rendered');
  return captured.snackbar;
}

/** The URLs of the export requests sent, in order. */
const exportRequests = () =>
  fetchMock.mock.calls
    .map(([request]) => request)
    .filter((request): request is Request => request instanceof Request)
    .filter((request) => new URL(request.url).pathname === '/api/v1/customers/export');

beforeEach(async () => {
  captured.radioGroup = null;
  captured.snackbar = null;
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
  vi.restoreAllMocks();
});

describe('CustomersView export', () => {
  it('asks which list to download, with the filtered list picked while a filter applies', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all?status=ARCHIVAL');
    await screen.findByText('OZAROW CEMENT S.A.');

    await user.click(exportButton());

    expect(exportDialog()).toBeInTheDocument();
    expect(within(exportDialog()).getByRole('group', { name: 'I want to download' })).toBeVisible();
    expect(radioGroup()).toMatchObject({
      selectedOption: 'filtered',
      options: [
        {
          key: 'filtered',
          text: 'The full customer list by the filters',
          value: 'filtered',
          disabled: false,
        },
        { key: 'all', text: 'The full customer list without filters', value: 'all' },
        {
          key: 'withLimits',
          text: 'The customer list with limits',
          value: 'withLimits',
          disabled: true,
        },
      ],
    });
    expect(exportRequests()).toEqual([]);
  });

  it('offers the filtered list for a search alone', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all?q=carrefour');
    await screen.findByText('CARREFOUR POLAND SP. Z O.O.');

    await user.click(exportButton());

    expect(radioGroup().selectedOption).toBe('filtered');
    expect(radioGroup().options[0]).toMatchObject({ value: 'filtered', disabled: false });
  });

  it('disables the filtered list and picks all customers when nothing narrows the list', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(exportButton());

    expect(radioGroup().selectedOption).toBe('all');
    expect(radioGroup().options[0]).toMatchObject({ value: 'filtered', disabled: true });
  });

  it('downloads what the table shows: its columns, the search and the filters, without sorting', async () => {
    const user = userEvent.setup();
    const download = vi
      .spyOn(baseApiModule, 'downloadFileFromResponse')
      .mockResolvedValue(undefined);
    renderPage('/customers/all?q=carrefour&status=ACTIVE&type=CORPORATE&sort=fullName&dir=desc', [
      'fullName',
      'status',
      'kkf',
    ]);
    await screen.findByText('CARREFOUR POLAND SP. Z O.O.');

    await user.click(exportButton());
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['xlsx'])));
    await user.click(within(exportDialog()).getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const [request] = exportRequests();
    if (request === undefined) throw new Error('No export request was sent');
    const params = new URL(request.url).searchParams;
    expect(request.headers.get('Accept-Language')).toBe('en');
    expect(params.getAll('columnSelection')).toEqual(['fullName', 'status', 'kkf']);
    expect(params.get('query')).toBe('carrefour');
    expect(params.getAll('status')).toEqual(['ACTIVE']);
    expect(params.has('type')).toBe(false);
    expect(params.has('sort')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(exportButton()).toHaveFocus();
    expect(snackbar()).toMatchObject({
      visibility: true,
      type: 'info',
      message: 'Download started. To see the details, open the downloads in your web browser',
    });
  });

  it("downloads all customers in the table's columns when the user asks for no filters", async () => {
    const user = userEvent.setup();
    const download = vi
      .spyOn(baseApiModule, 'downloadFileFromResponse')
      .mockResolvedValue(undefined);
    renderPage('/customers/all?q=carrefour&status=ACTIVE', ['fullName', 'status']);
    await screen.findByText('CARREFOUR POLAND SP. Z O.O.');

    await user.click(exportButton());
    act(() => radioGroup().onChange?.('all'));
    expect(radioGroup().selectedOption).toBe('all');
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['xlsx'])));
    await user.click(within(exportDialog()).getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const [request] = exportRequests();
    if (request === undefined) throw new Error('No export request was sent');
    const params = new URL(request.url).searchParams;
    expect(params.getAll('columnSelection')).toEqual(['fullName', 'status']);
    expect(params.has('query')).toBe(false);
    expect(params.has('status')).toBe(false);
  });

  it('says so under the table when the download fails', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(exportButton());
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await user.click(within(exportDialog()).getByRole('button', { name: 'Download' }));

    await waitFor(() =>
      expect(snackbar()).toMatchObject({
        visibility: true,
        type: 'error',
        message: 'Could not download the file. Please try again.',
      }),
    );
  });

  it('hides the notice when it is closed', async () => {
    const user = userEvent.setup();
    vi.spyOn(baseApiModule, 'downloadFileFromResponse').mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');
    await user.click(exportButton());
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['xlsx'])));
    await user.click(within(exportDialog()).getByRole('button', { name: 'Download' }));
    await waitFor(() => expect(snackbar().visibility).toBe(true));

    act(() => snackbar().onHide(false));

    expect(snackbar().visibility).toBe(false);
  });

  it('sends nothing on Cancel and gives focus back to the export button', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(exportButton());
    await user.click(within(exportDialog()).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(exportButton()).toHaveFocus();
    expect(exportRequests()).toEqual([]);
    expect(snackbar().visibility).toBe(false);
  });
});
