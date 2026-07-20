import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ContextualSidebar } from './ContextualSidebar';

interface MockMenuItem {
  id: string;
  text: string;
}

interface MockMenuListProps {
  items: MockMenuItem[];
  selectedId?: string;
  onItemSelect?: (item: MockMenuItem) => void;
  'aria-label'?: string;
}

interface MockNavigationPanelProps {
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}

vi.mock('@/ui', () => ({
  cx: (...values: Array<string | false | undefined>) => values.filter(Boolean).join(' '),
  NavigationIcon: () => <span aria-hidden="true" />,
  NavigationPanel: ({ title, footer, children }: MockNavigationPanelProps) => (
    <div data-title={title}>
      {children}
      {footer}
    </div>
  ),
  MenuList: ({ items, selectedId, onItemSelect, 'aria-label': ariaLabel }: MockMenuListProps) => (
    <div aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.id === selectedId ? 'page' : undefined}
          onClick={() => onItemSelect?.(item)}
        >
          {item.text}
        </button>
      ))}
    </div>
  ),
}));

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe('ContextualSidebar', () => {
  beforeEach(() => window.localStorage.clear());

  it('renders the active section menu and navigates by stable item ID', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ContextualSidebar />
        <LocationProbe />
      </>,
      { initialEntries: ['/portfolio/reviews'] },
    );

    expect(screen.getByRole('button', { name: 'Przeglądy' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('button', { name: 'Klienci w portfelu' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/portfolio/clients');
  });

  it('persists the desktop collapse preference', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/clients/all'] });

    const navigation = screen.getByRole('complementary', { name: 'Nawigacja' });
    expect(navigation).toHaveAttribute('data-collapsed', 'false');
    await user.click(screen.getByRole('button', { name: 'Zwiń nawigację' }));
    expect(navigation).toHaveAttribute('data-collapsed', 'true');
    expect(window.localStorage.getItem('scaffold.navigation.sidebar-collapsed')).toBe('true');
  });

  it('omits the sidebar for a section without configured items', () => {
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/groups'] });
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
