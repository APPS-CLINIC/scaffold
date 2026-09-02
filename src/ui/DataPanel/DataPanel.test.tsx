import { createRef, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DataPanel, type DataPanelFieldConfig } from './DataPanel';

interface DemoData {
  name: string;
  rating: string | null;
  missing: string | null;
}

const renderMissing = vi.fn((_context: unknown): ReactNode => <strong>unexpected</strong>);

const fields: readonly DataPanelFieldConfig<DemoData>[] = [
  {
    id: 'name',
    labelKey: 'customers.summaryPanel.field.grid',
    column: 'summary',
    value: (data) => data.name,
    formatValue: (value) => String(value).toUpperCase(),
  },
  {
    id: 'missing',
    labelKey: 'customers.summaryPanel.field.kkf',
    column: 1,
    value: (data) => data.missing,
    renderValue: renderMissing,
  },
  {
    id: 'rating',
    valueOnly: true,
    column: 2,
    value: (data) => data.rating,
    valueSize: 'label',
    renderValue: ({ value }) => <strong>{String(value)}</strong>,
  },
];

describe('DataPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
    renderMissing.mockClear();
  });

  it('renders configured fields through IWA definition lists and supports formatting', () => {
    const panelRef = createRef<HTMLDivElement>();
    const { container } = render(
      <DataPanel
        ref={panelRef}
        aria-label="Demo data panel"
        data={{ name: 'acme', rating: 'AAA', missing: null }}
        icon={<span>Icon</span>}
        header={<span>Header</span>}
        columnLabels={{
          first: 'customers.summaryPanel.column.identification',
          second: 'customers.summaryPanel.column.rating',
        }}
        fields={fields}
        emptyValue="—"
        className="custom-panel"
      />,
    );

    expect(screen.getByText('GRID').closest('dl')).toHaveTextContent('ACME');
    expect(screen.getByText('GRID').parentElement).toHaveTextContent('GRID:');
    expect(screen.getByText('AAA').closest('section')).toHaveTextContent('Rating');
    expect(screen.getByText('AAA').closest('dl')).toBeNull();
    expect(screen.getByText('KKF').closest('dl')).toHaveTextContent('—');
    expect(renderMissing).not.toHaveBeenCalled();
    expect(panelRef.current).toHaveAttribute('aria-label', 'Demo data panel');
    expect(container.firstElementChild).toHaveClass(
      'grid',
      'grid-cols-1',
      'lg:grid-cols-4',
      'custom-panel',
    );
    expect(screen.getByText('GRID').closest('section')).toBeNull();
  });

  it('keeps the configured row present when a custom renderer returns an empty value', () => {
    const { container } = render(
      <DataPanel
        data={{ name: 'Acme', rating: 'AAA', missing: 'present' }}
        fields={[
          {
            id: 'empty-renderer',
            labelKey: 'customers.summaryPanel.field.grid',
            column: 1,
            value: (data) => data.name,
            renderValue: () => null,
          },
        ]}
        emptyValue="—"
      />,
    );

    expect(screen.getByText('GRID').closest('dl')).toHaveTextContent('—');
    expect(container.firstElementChild).toHaveClass('lg:grid-cols-1');
  });

  it('keeps richer-value geometry when the value is empty', () => {
    const ratingField = fields.find((field) => field.id === 'rating');
    if (!ratingField) throw new Error('Rating field fixture is missing');

    render(
      <DataPanel<DemoData>
        data={{ name: 'Acme', rating: null, missing: null }}
        fields={[ratingField]}
        emptyValue="—"
      />,
    );

    const ratingValue = screen.getByText('—');
    expect(ratingValue).toHaveClass('h-6');
    expect(ratingValue.closest('section')).toBeNull();
  });

  it('uses the same bounded geometry for long loaded values as the skeleton', () => {
    const longName = 'A very long corporate group name that must not resize the panel after load';

    render(
      <DataPanel
        data={{ name: longName, rating: null, missing: null }}
        fields={[fields[0]!]}
        emptyValue="–"
      />,
    );

    const value = screen.getByTitle(longName.toUpperCase());
    expect(value).toHaveClass('h-5', 'truncate');
    expect(value).toHaveTextContent(longName.toUpperCase());
  });
});
