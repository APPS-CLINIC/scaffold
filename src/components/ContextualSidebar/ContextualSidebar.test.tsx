import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ContextualSidebar } from './ContextualSidebar';

interface MockMenuItem {
  id: string;
  text: string;
  icon?: ReactNode;
}

interface MockMenuListAdapterProps {
  items: MockMenuItem[];
  selectedId?: string;
  onItemSelect?: (item: MockMenuItem) => void;
  'aria-label'?: string;
}

interface MockNavigationPanelProps {
  title: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

interface MockNavigationIconProps {
  role?: string;
  'aria-label'?: string;
}

vi.mock('@/ui', () => ({
  cx: (...values: Array<string | false | undefined>) => values.filter(Boolean).join(' '),
  NavigationIcon: ({ role, 'aria-label': ariaLabel }: MockNavigationIconProps) => (
    <span role={role} aria-label={ariaLabel} aria-hidden={ariaLabel ? undefined : 'true'} />
  ),
  NavigationPanel: ({ title, headerAction, footer, children }: MockNavigationPanelProps) => (
    <div data-title={title}>
      {headerAction}
      {children}
      {footer}
    </div>
  ),
  MenuListAdapter: ({
    items,
    selectedId,
    onItemSelect,
    'aria-label': ariaLabel,
  }: MockMenuListAdapterProps) => (
    <div aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.id === selectedId ? 'page' : undefined}
          onClick={() => onItemSelect?.(item)}
        >
          {item.icon}
          {item.text}
        </button>
      ))}
    </div>
  ),
}));

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function SectionSwitcher() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/customers/all')}>
      Open clients
    </button>
  );
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

  it('loads the contextual menu again when the top-level section URL changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <ContextualSidebar />
        <SectionSwitcher />
      </>,
      { initialEntries: ['/portfolio/dashboard'] },
    );

    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('button', { name: 'Open clients' }));
    expect(screen.queryByRole('button', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wszyscy klienci' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('persists the desktop collapse preference', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/customers/all'] });

    const navigation = screen.getByRole('complementary', { name: 'Nawigacja' });
    expect(navigation).toHaveAttribute('data-collapsed', 'false');
    await user.click(screen.getByRole('button', { name: 'Zwiń nawigację' }));
    expect(navigation).toHaveAttribute('data-collapsed', 'true');
    expect(screen.queryByText('Wszyscy klienci')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wszyscy klienci' })).toBeInTheDocument();
    expect(window.localStorage.getItem('scaffold.navigation.sidebar-collapsed')).toBe('true');
  });

  it('renders the default sidebar item for a section without dedicated items', () => {
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/groups'] });
    expect(screen.getByRole('complementary', { name: 'Nawigacja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Przegląd' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
