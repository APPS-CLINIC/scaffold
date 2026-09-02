import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyValueSections, type KeyValueSection } from './KeyValueSections';

const sections: readonly KeyValueSection[] = [
  {
    id: 'basic-data',
    title: 'Basic data',
    items: [
      { id: 'name', label: 'Name', value: 'Acme' },
      { id: 'tax-id', label: 'Tax ID', value: null },
      { id: 'blank-code', label: 'Blank code', value: '   ' },
      { id: 'employees', label: 'Employees', value: 0 },
    ],
  },
  {
    id: 'advisors',
    title: 'Advisors',
    items: [{ id: 'relationship-manager', label: 'Relationship manager', value: '' }],
  },
];

describe('KeyValueSections', () => {
  it('renders named IWA-card sections and keeps every configured row', () => {
    const panelRef = createRef<HTMLDivElement>();
    const { container } = render(
      <KeyValueSections
        ref={panelRef}
        aria-label="Customer details"
        sections={sections}
        emptyValue="—"
        className="min-w-full custom-sections"
      />,
    );

    const basicData = screen.getByRole('region', { name: 'Basic data' });
    const advisors = screen.getByRole('region', { name: 'Advisors' });

    expect(within(basicData).getByText('Name').closest('dl')).toHaveTextContent('Acme');
    expect(within(basicData).getByText('Tax ID').closest('dl')).toHaveTextContent('—');
    expect(within(basicData).getByText('Blank code').closest('dl')).toHaveTextContent('—');
    expect(within(basicData).getByText('Employees').closest('dl')).toHaveTextContent('0');
    expect(within(advisors).getByText('Relationship manager').closest('dl')).toHaveTextContent('—');
    expect(within(basicData).getByText('Name').closest('dl')?.parentElement).toHaveClass(
      'sm:[&>dl]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
      'md:[&>dl]:flex',
      'md:[&_dt]:w-40',
      'md:[&_dt]:text-right',
      'xl:[&_dt]:w-52',
      'md:[&_dd]:flex-1',
    );
    expect(container.querySelectorAll('.p-card')).toHaveLength(2);
    expect(panelRef.current).toHaveAttribute('aria-label', 'Customer details');
    expect(panelRef.current).toHaveAttribute('role', 'group');
    expect(panelRef.current).toHaveClass('min-w-full', 'custom-sections');
    expect(panelRef.current).not.toHaveClass('min-w-0');
  });

  it('keeps the configured geometry and replaces only values while loading', () => {
    const { container } = render(
      <KeyValueSections aria-label="Loading customer details" sections={sections} loading />,
    );

    const panel = screen.getByLabelText('Loading customer details');

    expect(panel).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('region', { name: 'Basic data' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();
    expect(container.querySelectorAll('dl')).toHaveLength(5);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
  });

  it('uses the configured heading level for nested page sections', () => {
    render(<KeyValueSections sections={sections} headingLevel={3} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Basic data' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Basic data' })).not.toBeInTheDocument();
  });

  it('uses an en dash as the default empty-value fallback', () => {
    render(
      <KeyValueSections
        sections={[
          {
            id: 'empty-data',
            title: 'Empty data',
            items: [{ id: 'missing-value', label: 'Missing value' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Missing value').closest('dl')).toHaveTextContent('–');
  });
});
