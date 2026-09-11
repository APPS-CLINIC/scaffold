import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
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
  twMerge: (...values: Array<string | false | undefined>) => values.filter(Boolean).join(' '),
  createPrimeIcon: () => () => null,
  PrimeIcon: () => <span aria-hidden="true" />,
  NavigationMenuItem: ({ mainNode }: { mainNode: ReactNode }) => <div>{mainNode}</div>,
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

    expect(screen.getByRole('button', { name: i18n.t('nav.portfolio.reviews') })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('button', { name: i18n.t('nav.portfolio.clients') }));
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

    expect(screen.getByRole('button', { name: i18n.t('nav.portfolio.dashboard') })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('button', { name: 'Open clients' }));
    expect(
      screen.queryByRole('button', { name: i18n.t('nav.portfolio.dashboard') }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('nav.customers.all') })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('persists the desktop collapse preference', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/customers/all'] });

    const navigation = screen.getByRole('complementary', { name: i18n.t('nav.title') });
    expect(navigation).toHaveAttribute('data-collapsed', 'false');
    const collapseButton = screen.getByRole('button', {
      name: i18n.t('nav.sidebar.collapse'),
    });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    await user.click(collapseButton);
    expect(navigation).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('button', { name: i18n.t('nav.sidebar.expand') })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText(i18n.t('nav.customers.all'))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('nav.customers.all') })).toBeInTheDocument();
    expect(window.localStorage.getItem('scaffold.navigation.sidebar-collapsed')).toBe('true');
  });

  it('renders the default sidebar item for a section without dedicated items', () => {
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/groups'] });
    expect(screen.getByRole('complementary', { name: i18n.t('nav.title') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('nav.sidebar.overview') })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('switches the sidebar from the global list to the customer tree from the URL', () => {
    renderWithProviders(<ContextualSidebar />, {
      initialEntries: ['/customers/42/general-data'],
    });

    expect(
      screen.getByRole('complementary', {
        name: i18n.t('nav.customerDetail.navigation'),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('nav.customerDetail.generalData') }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('button', { name: i18n.t('nav.customers.all') }),
    ).not.toBeInTheDocument();
  });

  it('uses a mobile-hidden desktop rail', () => {
    renderWithProviders(<ContextualSidebar />, { initialEntries: ['/customers/all'] });

    const navigation = screen.getByRole('complementary', { name: i18n.t('nav.title') });
    expect(navigation).toHaveClass('hidden', 'md:flex', 'min-h-0', 'overflow-hidden');
  });
});
