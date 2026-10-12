import { isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { act } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { MenuItem } from 'primereact/menuitem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TopBarCustom } from './TopBarCustom';

/** A top-bar item's menu, as the IWA PopupMenu takes it. */
interface ItemMenu {
  icon: ReactNode;
  label: string;
  items: MenuItem[];
}

// The top-bar items are checked through the props handed to the library: their menu is
// vendor markup that differs between the test double and the real library.
const items: { menuProps?: ItemMenu }[] = [];

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  const TopBar = Object.assign(
    (props: ComponentProps<typeof actual.TopBar>) => <actual.TopBar {...props} />,
    {
      Item: (props: ComponentProps<typeof actual.TopBar.Item>) => {
        items.push(props as { menuProps?: ItemMenu });
        return <actual.TopBar.Item {...props} />;
      },
    },
  );
  return { ...actual, TopBar };
});

/** The language menu as last rendered. */
function languageMenu(): ItemMenu {
  const menu = items.findLast((item) =>
    item.menuProps?.items.some((entry: MenuItem) => entry.label === 'English'),
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
    expect(languageMenu().items.map((entry: MenuItem) => entry.label)).toEqual([
      'Polski',
      'English',
    ]);
  });

  it('gives every language an icon element, ticking only the current language', () => {
    renderWithProviders(<TopBarCustom />);

    const icons: unknown[] = languageMenu().items.map((entry: MenuItem) => entry.icon as unknown);
    expect(icons.every((icon: unknown) => isValidElement(icon))).toBe(true);
    expect(
      icons.map((icon: unknown) => (icon as ReactElement<{ className?: string }>).props.className),
    ).toEqual(['', 'invisible']);
  });

  it('switches the app to the picked language and remembers it', async () => {
    renderWithProviders(<TopBarCustom />);

    await act(async () => {
      languageMenu().items[1]?.command?.({} as never);
    });

    expect(i18n.resolvedLanguage).toBe('en');
    expect(window.localStorage.getItem('scaffold.language')).toBe('en');
    expect(languageMenu().label).toBe('English');
  });
});
