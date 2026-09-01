import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { DataPanelSkeletonFieldConfig } from './DataPanel';
import { DataPanelSkeleton } from './DataPanelSkeleton';

const fields: readonly DataPanelSkeletonFieldConfig[] = [
  { id: 'grid', labelKey: 'customers.summaryPanel.field.grid', column: 1 },
  {
    id: 'corporate-group-name',
    labelKey: 'customers.summaryPanel.field.corporateGroupName',
    column: 1,
  },
  {
    id: 'rating',
    labelKey: 'customers.summaryPanel.field.rating',
    column: 2,
    valueSize: 'label',
  },
];

describe('DataPanelSkeleton', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
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
    expect(screen.getAllByText('Rating')).toHaveLength(2);
    expect(screen.getByText(i18n.t('customers.summaryPanel.field.corporateGroupName'))).toHaveClass(
      'invisible',
    );
    expect(skeletonRef.current).toBe(
      container.querySelector('[data-testid="data-panel-skeleton"]'),
    );
    expect(skeletonRef.current).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('dl')).toHaveLength(3);
    expect(container.querySelectorAll('dl .h-5')).toHaveLength(5);
    expect(container.querySelectorAll('dl .h-6')).toHaveLength(1);
    expect(container.querySelector('.custom-skeleton')).toHaveClass(
      'grid-cols-1',
      'lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]',
    );
    for (const skeleton of container.querySelectorAll('[style*="width: 100%"]')) {
      expect(skeleton).toHaveStyle({ height: '100%' });
    }
  });
});
