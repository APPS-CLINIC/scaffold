import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RootLayout } from './RootLayout';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RootLayout', () => {
  it('starts loading the dictionaries of the current language when the app opens', async () => {
    const fetchMock = installCustomerApiTestTransport();
    await i18n.changeLanguage('en');

    renderWithProviders(<RootLayout />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const requests = fetchMock.mock.calls.map(([request]) => request as Request);
    expect(
      requests.map((request) => [
        new URL(request.url).pathname,
        request.headers.get('Accept-Language'),
      ]),
    ).toEqual([['/api/dictionaries', 'en']]);
  });
});
