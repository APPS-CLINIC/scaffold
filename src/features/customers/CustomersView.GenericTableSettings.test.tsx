import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeEach(async () => {
  mockTableContainerWidth(1380);
  installCustomerApiTestTransport();
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
