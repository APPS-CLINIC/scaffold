import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as IwaComponents from 'iwa-react-components';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';

type SearchProps = ComponentProps<typeof IwaComponents.SearchWithAutocomplete>;

const { searchSpy } = vi.hoisted(() => ({ searchSpy: vi.fn() }));

// Captures the props handed to the IWA search field; the assertion is a
// className contract, not the library's markup.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  SearchWithAutocomplete: (props: SearchProps) => {
    searchSpy(props);
    return null;
  },
}));

const appendToHead = document.head.appendChild.bind(document.head);
const lastSearchProps = () => searchSpy.mock.calls.at(-1)?.[0] as SearchProps;

beforeEach(async () => {
  mockTableContainerWidth(1380);
  installCustomerApiTestTransport();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('en');
});

describe('CustomersView search field', () => {
  it('hands the neutral input overrides to the IWA search field', () => {
    renderWithProviders(
      <>
        <UrlStateSync />
        <CustomersView />
      </>,
      { initialEntries: ['/customers/all'] },
    );

    const classes = (lastSearchProps().className ?? '').split(/\s+/);
    expect(classes).toEqual(
      expect.arrayContaining([
        'w-full',
        'max-w-96',
        '[&_input]:!bg-[var(--surface)]',
        '[&_input]:!border-[var(--border)]',
        '[&_input:focus]:!border-[var(--navigation-accent)]',
        '[&_input:focus]:![box-shadow:none]',
        '[&_input:focus]:!outline-none',
      ]),
    );
    expect(lastSearchProps().placeholder).toBe('Search the list');
  });
});
