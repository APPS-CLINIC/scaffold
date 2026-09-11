import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { DataPanelSkeletonFieldConfig } from './DataPanel';
import { DataPanelSkeleton } from './DataPanelSkeleton';

const fields: readonly DataPanelSkeletonFieldConfig[] = [
  { id: 'grid', labelKey: 'customers.summaryPanel.field.grid', column: 'summary' },
  {
    id: 'corporate-group-name',
    labelKey: 'customers.summaryPanel.field.corporateGroupName',
    column: 1,
  },
  {
    id: 'rating',
    valueOnly: true,
    column: 2,
    valueSize: 'label',
  },
];

describe('DataPanelSkeleton', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
  });

  it('reserves the configured hero icon geometry', () => {
    const { container } = render(<DataPanelSkeleton fields={fields} hasIcon iconSize="hero" />);

    expect(container.querySelector('.size-24.rounded-full')).toBeInTheDocument();
    expect(container.querySelector('.size-12.rounded-full')).not.toBeInTheDocument();
  });

  it('reserves the loaded name and status line geometry', () => {
    const { container } = render(<DataPanelSkeleton fields={fields} hasHeader />);

    expect(container.querySelector('.h-8 > .h-7')).toBeInTheDocument();
    expect(container.querySelector('.h-7 > .h-6')).toBeInTheDocument();
  });

  it('reserves the same responsive grid, headings and configured row count', () => {
    const skeletonRef = createRef<HTMLDivElement>();
    const { container } = render(
      <DataPanelSkeleton
        ref={skeletonRef}
        data-testid="data-panel-skeleton"
        fields={fields}
        columnLabels={{
          first: 'customers.summaryPanel.column.identification',
          second: 'customers.summaryPanel.column.rating',
        }}
        hasIcon
        hasHeader
        className="custom-skeleton"
      />,
    );

    expect(
      screen.getByText(i18n.t('customers.summaryPanel.column.identification')),
    ).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('customers.summaryPanel.field.corporateGroupName'))).toHaveClass(
      'invisible',
    );
    expect(skeletonRef.current).toBe(
      container.querySelector('[data-testid="data-panel-skeleton"]'),
    );
    expect(skeletonRef.current).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('dl')).toHaveLength(2);
    expect(container.querySelectorAll('dl .h-5')).toHaveLength(4);
    expect(container.querySelector('.h-6')).toBeInTheDocument();
    expect(container.querySelector('.custom-skeleton')).toHaveClass(
      'grid-cols-1',
      'md:grid-cols-[auto_minmax(0,1fr)]',
      'lg:grid-cols-4',
    );
    for (const skeleton of container.querySelectorAll('[style*="width: 100%"]')) {
      expect(skeleton).toHaveStyle({ height: '100%' });
    }
  });
});
