import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { resolveNavigation, type ResolvedNavigationNode } from '@/routes/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { NavigationTree } from './NavigationTree';

function NavigationTreeHarness({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { pathname } = useLocation();
  const sidebar = resolveNavigation(pathname).sidebar;

  if (!sidebar || sidebar.presentation !== 'tree') return null;

  return (
    <>
      <NavigationTree
        items={sidebar.items}
        expandedIds={sidebar.expandedIds}
        isCollapsed={isCollapsed}
      />
      <output aria-label="Current path">{pathname}</output>
    </>
  );
}

const TestIcon = () => null;

const threeLevelItems: readonly ResolvedNavigationNode[] = [
  {
    id: 'reviews',
    labelKey: 'nav.customerDetail.reviews',
    icon: TestIcon,
    path: '/customers/42/reviews',
    isActive: true,
    isCurrent: false,
    children: [
      {
        id: 'review-details',
        labelKey: 'nav.customerDetail.reviewDetails',
        icon: TestIcon,
        path: '/customers/42/reviews/details',
        isActive: true,
        isCurrent: false,
        children: [
          {
            id: 'monitoring-record',
            labelKey: 'nav.customerDetail.monitoring',
            icon: TestIcon,
            path: '/customers/42/reviews/details/record',
            isActive: true,
            isCurrent: true,
            children: [],
          },
        ],
      },
    ],
  },
];

function ThreeLevelNavigationTreeHarness() {
  const { pathname } = useLocation();

  return (
    <>
      <NavigationTree
        items={threeLevelItems}
        expandedIds={['reviews', 'review-details']}
        isCollapsed={false}
      />
      <output aria-label="Current path">{pathname}</output>
    </>
  );
}

describe('NavigationTree', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
  });

  it('auto-expands a deep-linked IWA subnode and keeps its parent active when collapsed', async () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const detailsLabel = i18n.t('nav.customerDetail.reviewDetails');
    const collapseLabel = `${i18n.t('nav.sidebar.collapse')}: ${reviewsLabel}`;
    const user = userEvent.setup();
    renderWithProviders(<NavigationTreeHarness />, {
      initialEntries: ['/customers/42/reviews/details/record-7'],
    });

    const parent = screen.getByRole('button', { name: reviewsLabel });
    expect(parent.parentElement).toHaveAttribute('data-active', 'true');
    expect(parent.parentElement).toHaveClass('bg-content-surface', 'font-bold');
    expect(screen.getByRole('button', { name: detailsLabel })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: collapseLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: collapseLabel }));
    expect(screen.queryByRole('button', { name: detailsLabel })).not.toBeInTheDocument();
    expect(parent).toHaveAttribute('aria-current', 'location');
  });

  it('uses a separate accessible toggle and navigates to resolved child paths', async () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const detailsLabel = i18n.t('nav.customerDetail.reviewDetails');
    const expandLabel = `${i18n.t('nav.sidebar.expand')}: ${reviewsLabel}`;
    const user = userEvent.setup();
    renderWithProviders(<NavigationTreeHarness />, {
      initialEntries: ['/customers/42/products'],
    });

    const toggle = screen.getByRole('button', { name: expandLabel });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/42/products');
    expect(screen.getByRole('button', { name: detailsLabel })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: detailsLabel }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/customers/42/reviews/details',
    );
  });

  it('keeps collapsed rail items named while hiding nested content', () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const detailsLabel = i18n.t('nav.customerDetail.reviewDetails');
    const collapseLabel = `${i18n.t('nav.sidebar.collapse')}: ${reviewsLabel}`;
    renderWithProviders(<NavigationTreeHarness isCollapsed />, {
      initialEntries: ['/customers/42/reviews/details'],
    });

    const activeParent = screen.getByRole('button', { name: reviewsLabel });
    expect(activeParent).toHaveAttribute('title', reviewsLabel);
    expect(activeParent).toHaveAttribute('aria-current', 'location');
    expect(screen.queryByRole('button', { name: detailsLabel })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: collapseLabel })).not.toBeInTheDocument();
  });

  it('renders arbitrary-depth branches and retains nested disclosure state', async () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const detailsLabel = i18n.t('nav.customerDetail.reviewDetails');
    const recordLabel = i18n.t('nav.customerDetail.monitoring');
    const collapseReviewsLabel = `${i18n.t('nav.sidebar.collapse')}: ${reviewsLabel}`;
    const expandReviewsLabel = `${i18n.t('nav.sidebar.expand')}: ${reviewsLabel}`;
    const collapseDetailsLabel = `${i18n.t('nav.sidebar.collapse')}: ${detailsLabel}`;
    const user = userEvent.setup();
    renderWithProviders(<ThreeLevelNavigationTreeHarness />, {
      initialEntries: ['/customers/42/reviews/details/record'],
    });

    expect(screen.getByRole('button', { name: collapseReviewsLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: collapseDetailsLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: recordLabel })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('button', { name: collapseReviewsLabel }));
    expect(screen.queryByRole('button', { name: detailsLabel })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: expandReviewsLabel }));
    expect(screen.getByRole('button', { name: collapseDetailsLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await user.click(screen.getByRole('button', { name: recordLabel }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/customers/42/reviews/details/record',
    );
  });
});
