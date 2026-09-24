import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import {
  navigationManifest,
  resolveNavigation,
  type NavigationManifest,
  type NavigationTreeItemConfig,
  type ResolvedNavigationNode,
} from '@/routes/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { NavigationTree } from './NavigationTree';

const TestIcon = () => null;

/** The real manifest with one child under Reviews, to exercise nested tree behaviour. */
const nestedManifest: NavigationManifest = {
  ...navigationManifest,
  sections: navigationManifest.sections.map((section) => {
    if (!('context' in section)) return section;

    const items: readonly NavigationTreeItemConfig[] = section.context.sidebar.items;
    return {
      ...section,
      context: {
        ...section.context,
        sidebar: {
          type: 'tree',
          items: items.map((item) =>
            item.id === 'reviews'
              ? {
                  ...item,
                  children: [
                    {
                      id: 'review-audit',
                      segment: 'audit',
                      labelKey: 'nav.portfolio.auditProcess',
                      icon: TestIcon,
                    },
                  ],
                }
              : item,
          ),
        },
      },
    };
  }),
};

function NavigationTreeHarness({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { pathname } = useLocation();
  const sidebar = resolveNavigation(pathname, nestedManifest).sidebar;

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
        id: 'review-audit',
        labelKey: 'nav.portfolio.auditProcess',
        icon: TestIcon,
        path: '/customers/42/reviews/audit',
        isActive: true,
        isCurrent: false,
        children: [
          {
            id: 'monitoring-record',
            labelKey: 'nav.customerDetail.monitoring',
            icon: TestIcon,
            path: '/customers/42/reviews/audit/record',
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
        expandedIds={['reviews', 'review-audit']}
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
    const childLabel = i18n.t('nav.portfolio.auditProcess');
    const collapseLabel = `${i18n.t('nav.sidebar.collapse')}: ${reviewsLabel}`;
    const user = userEvent.setup();
    renderWithProviders(<NavigationTreeHarness />, {
      initialEntries: ['/customers/42/reviews/audit/record-7'],
    });

    const parent = screen.getByRole('button', { name: reviewsLabel });
    expect(parent.parentElement).toHaveAttribute('data-active', 'true');
    expect(parent.parentElement).toHaveClass('bg-content-surface', 'font-bold');
    expect(screen.getByRole('button', { name: childLabel })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: collapseLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: collapseLabel }));
    expect(screen.queryByRole('button', { name: childLabel })).not.toBeInTheDocument();
    expect(parent).toHaveAttribute('aria-current', 'location');
  });

  it('uses a separate accessible toggle and navigates to resolved child paths', async () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const childLabel = i18n.t('nav.portfolio.auditProcess');
    const expandLabel = `${i18n.t('nav.sidebar.expand')}: ${reviewsLabel}`;
    const user = userEvent.setup();
    renderWithProviders(<NavigationTreeHarness />, {
      initialEntries: ['/customers/42/products'],
    });

    const toggle = screen.getByRole('button', { name: expandLabel });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/42/products');
    expect(screen.getByRole('button', { name: childLabel })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: childLabel }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/42/reviews/audit');
  });

  it('keeps collapsed rail items named while hiding nested content', () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const childLabel = i18n.t('nav.portfolio.auditProcess');
    const collapseLabel = `${i18n.t('nav.sidebar.collapse')}: ${reviewsLabel}`;
    renderWithProviders(<NavigationTreeHarness isCollapsed />, {
      initialEntries: ['/customers/42/reviews/audit'],
    });

    const activeParent = screen.getByRole('button', { name: reviewsLabel });
    expect(activeParent).toHaveAttribute('title', reviewsLabel);
    expect(activeParent).toHaveAttribute('aria-current', 'location');
    expect(screen.queryByRole('button', { name: childLabel })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: collapseLabel })).not.toBeInTheDocument();
  });

  it('renders arbitrary-depth branches and retains nested disclosure state', async () => {
    const reviewsLabel = i18n.t('nav.customerDetail.reviews');
    const childLabel = i18n.t('nav.portfolio.auditProcess');
    const recordLabel = i18n.t('nav.customerDetail.monitoring');
    const collapseReviewsLabel = `${i18n.t('nav.sidebar.collapse')}: ${reviewsLabel}`;
    const expandReviewsLabel = `${i18n.t('nav.sidebar.expand')}: ${reviewsLabel}`;
    const collapseChildLabel = `${i18n.t('nav.sidebar.collapse')}: ${childLabel}`;
    const user = userEvent.setup();
    renderWithProviders(<ThreeLevelNavigationTreeHarness />, {
      initialEntries: ['/customers/42/reviews/audit/record'],
    });

    expect(screen.getByRole('button', { name: collapseReviewsLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: collapseChildLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: recordLabel })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('button', { name: collapseReviewsLabel }));
    expect(screen.queryByRole('button', { name: childLabel })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: expandReviewsLabel }));
    expect(screen.getByRole('button', { name: collapseChildLabel })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await user.click(screen.getByRole('button', { name: recordLabel }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/customers/42/reviews/audit/record',
    );
  });
});
