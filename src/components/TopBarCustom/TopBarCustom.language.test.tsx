import type { ComponentProps } from 'react';
import { act, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TopBarCustom } from './TopBarCustom';

type TopBarItemProps = ComponentProps<typeof IwaComponents.TopBar.Item>;

// The top-bar items are checked through the props handed to the library: their menu is
// vendor markup that differs between the test double and the real library.
const items: TopBarItemProps[] = [];

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  const TopBar = Object.assign(
    (props: ComponentProps<typeof actual.TopBar>) => <actual.TopBar {...props} />,
    {
      Item: (props: TopBarItemProps) => {
        items.push(props);
        return <actual.TopBar.Item {...props} />;
      },
    },
  );
  return { ...actual, TopBar };
});

/** The language menu as last rendered. */
function languageMenu() {
  const menu = items.findLast((item) =>
    item.menuProps?.items.some((entry) => entry.label === 'English'),
  )?.menuProps;
  if (menu === undefined) throw new Error('The language menu was not rendered');
  return menu;
}

beforeEach(async () => {
  items.length = 0;
  await i18n.changeLanguage('pl');
});

afterEach(() => {
  window.localStorage.clear();
});

describe('TopBarCustom language menu', () => {
  it('names the current language and offers every language the app ships, by its own name', () => {
    renderWithProviders(<TopBarCustom />);

    expect(languageMenu()).toMatchObject({ icon: null, label: 'Polski' });
    expect(languageMenu().items.map((entry) => entry.label)).toEqual(['Polski', 'English']);
  });

  it('switches the app to the picked language and remembers it', async () => {
    renderWithProviders(<TopBarCustom />);

    await act(async () => {
      languageMenu().items[1]?.command?.({} as never);
    });

    expect(i18n.resolvedLanguage).toBe('en');
    expect(window.localStorage.getItem('scaffold.language')).toBe('en');
    expect(languageMenu().label).toBe('English');
    expect(screen.getByRole('button', { name: 'Recently viewed' })).toBeInTheDocument();
  });
});
