import { isValidElement, type ComponentProps } from 'react';
import { screen, waitFor } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';

type RichNotificationProps = ComponentProps<typeof IwaComponents.RichNotification>;

// The notification is checked through the props handed to the library: its markup is
// vendor markup that differs between the test double and the real library.
const captured: { notification: RichNotificationProps | null } = { notification: null };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    RichNotification: (props: RichNotificationProps) => {
      captured.notification = props;
      return <actual.RichNotification {...props} />;
    },
  };
});

const appendToHead = document.head.appendChild.bind(document.head);

function renderPage(initialEntry: string) {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
    </>,
    { initialEntries: [initialEntry] },
  );
}

/** The paragraph's text, as the view hands it to the library. */
function paragraphText(notification: RichNotificationProps): unknown {
  const { paragraph } = notification;
  return isValidElement<{ children?: unknown }>(paragraph) ? paragraph.props.children : undefined;
}

beforeEach(async () => {
  captured.notification = null;
  mockTableContainerWidth(1380);
  installCustomerApiTestTransport();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  await i18n.changeLanguage('pl');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CustomersView with no matching customer', () => {
  it.each([
    ['the search', '/customers/all?q=nobody'],
    ['the filters', '/customers/all?type=TECHNICAL_RECORD'],
  ])('says so when nothing matches %s', async (_case, initialEntry) => {
    renderPage(initialEntry);

    await waitFor(() => expect(captured.notification).not.toBeNull());
    const notification = captured.notification as RichNotificationProps;
    expect(notification.title).toBe('Nie znaleźliśmy klienta');
    expect(paragraphText(notification)).toBe(
      'Żaden z klientów na liście nie zawiera informacji, którą próbujesz znaleźć.\n' +
        'Spróbuj wpisać inny tekst lub jego fragment',
    );
    expect(isValidElement(notification.illustration)).toBe(true);
  });

  it('shows no notification while customers match', async () => {
    renderPage('/customers/all?q=carrefour');

    expect(await screen.findByText('CARREFOUR POLAND SP. Z O.O.')).toBeInTheDocument();
    expect(captured.notification).toBeNull();
  });
});
