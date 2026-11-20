import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { StaticDictionary } from './dictionaries.api';
import { useDictionary, usePreloadDictionaries } from './useDictionary';

let fetchMock: ReturnType<typeof installCustomerApiTestTransport>;

/** Shows what a view gets for one code: the state of the dictionary, then the label. */
function Label({ dictionary, code }: { dictionary: StaticDictionary; code: string | null }) {
  const { labelOf, loading, failed } = useDictionary(dictionary);
  const state = loading ? 'loading' : failed ? 'failed' : 'loaded';
  return (
    <p>
      {state}: {labelOf(code) ?? 'no label'}
    </p>
  );
}

function Entries({ dictionary }: { dictionary: StaticDictionary }) {
  const { entries } = useDictionary(dictionary);
  return <p>{entries.map(({ code }) => code).join(', ') || 'no entries'}</p>;
}

function Preload() {
  usePreloadDictionaries();
  return null;
}

const dictionaryRequests = () =>
  fetchMock.mock.calls
    .map(([request]) => request)
    .filter((request): request is Request => request instanceof Request)
    .filter((request) => new URL(request.url).pathname === '/api/dictionaries')
    .map((request) => request.headers.get('Accept-Language'));

beforeEach(async () => {
  fetchMock = installCustomerApiTestTransport();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDictionary', () => {
  it('reports loading until the service answers, then labels a code in the current language', async () => {
    renderWithProviders(<Label dictionary="customer-type" code="INVESTMENT_BANK" />);

    expect(screen.getByText('loading: no label')).toBeInTheDocument();
    expect(await screen.findByText('loaded: Investment bank')).toBeInTheDocument();
  });

  it('has no label for a code the dictionary does not know, or for no code', async () => {
    renderWithProviders(
      <>
        <Label dictionary="customer-type" code="Bank Inwestycyjny" />
        <Label dictionary="customer-status" code={null} />
      </>,
    );

    expect(await screen.findAllByText('loaded: no label')).toHaveLength(2);
  });

  it('lists the entries in the order the service sends them', async () => {
    renderWithProviders(<Entries dictionary="ts-price-condition-status" />);

    expect(screen.getByText('no entries')).toBeInTheDocument();
    expect(
      await screen.findByText('STANDARD_CONTRACT_END_DATE, NO_CONTRACT_END_DATE'),
    ).toBeInTheDocument();
  });

  it('reports a failure and labels nothing', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 }),
    );

    renderWithProviders(<Label dictionary="customer-type" code="INVESTMENT_BANK" />);

    expect(await screen.findByText('failed: no label')).toBeInTheDocument();
  });

  it('asks again when a view opened after a failure needs a dictionary', async () => {
    fetchMock.mockImplementationOnce(
      async () => new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 }),
    );
    const { rerender } = renderWithProviders(<Preload />);
    await waitFor(() => expect(dictionaryRequests()).toEqual(['en']));

    rerender(
      <>
        <Preload />
        <Label dictionary="customer-type" code="INVESTMENT_BANK" />
      </>,
    );

    expect(await screen.findByText('loaded: Investment bank')).toBeInTheDocument();
    expect(dictionaryRequests()).toEqual(['en', 'en']);
  });

  it('loads the labels again in the language the user switches to', async () => {
    renderWithProviders(<Label dictionary="customer-type" code="INVESTMENT_BANK" />);
    expect(await screen.findByText('loaded: Investment bank')).toBeInTheDocument();

    await act(() => i18n.changeLanguage('pl'));

    expect(await screen.findByText('loaded: Bank Inwestycyjny')).toBeInTheDocument();
    expect(dictionaryRequests()).toEqual(['en', 'pl']);
  });

  it('shares one request between the preload and every view that reads a dictionary', async () => {
    renderWithProviders(
      <>
        <Preload />
        <Label dictionary="customer-type" code="CORPORATE" />
        <Label dictionary="customer-status" code="ARCHIVAL" />
      </>,
    );

    expect(await screen.findByText('loaded: Corporate')).toBeInTheDocument();
    expect(screen.getByText('loaded: Archival')).toBeInTheDocument();
    await waitFor(() => expect(dictionaryRequests()).toEqual(['en']));
  });

  it('starts loading as soon as the preload mounts, before any view asks', async () => {
    renderWithProviders(<Preload />);

    await waitFor(() => expect(dictionaryRequests()).toEqual(['en']));
  });
});
