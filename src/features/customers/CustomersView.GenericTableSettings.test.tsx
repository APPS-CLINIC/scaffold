import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as baseApiModule from '@/api/baseApi';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';

const appendToHead = document.head.appendChild.bind(document.head);

function renderPage() {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
    </>,
    { initialEntries: ['/customers/all'] },
  );
}

let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

beforeEach(async () => {
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

describe('CustomersView table settings', () => {
  it('exports the customers in the active language', async () => {
    const user = userEvent.setup();
    const download = vi
      .spyOn(baseApiModule, 'downloadFileFromResponse')
      .mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    fetchMock.mockResolvedValueOnce(new Response(new Blob(['xlsx'])));
    await user.click(screen.getByText('Download to Excel'));

    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const exportRequest = fetchMock.mock.calls
      .map(([request]) => request)
      .find(
        (request): request is Request =>
          request instanceof Request && new URL(request.url).pathname === '/api/customers/export',
      );
    expect(exportRequest).toBeDefined();
    expect(new URL(exportRequest!.url).searchParams.get('locale')).toBe('en');
  });

  it('keeps several customers expanded at the same time', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    const expandButton = () => screen.getAllByRole('button', { name: /expand details for/i })[0]!;
    await user.click(expandButton());
    await user.click(expandButton());

    expect(screen.getAllByRole('region', { name: /collapse details for/i })).toHaveLength(2);
  });
});
