import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { GenericDataTableCellProps } from '../GenericDataTable.types';
import { ActiveArchivalStatusCell } from './ActiveArchivalStatusCell';
import { UnderlinedTextCell } from './UnderlinedTextCell';
import { ValidityStatusCell } from './ValidityStatusCell';

// Mock the library, never the `@/ui` barrel: a factory replaces the whole module, so
// faking the barrel would also delete the local primitives it exports.
vi.mock('iwa-react-components', () => import('@/test/iwaComponentsMock'));

interface TestRow {
  id: number;
  name: string | null;
  status: 'ACTIVE' | 'ARCHIVAL' | null;
  validity: 'valid' | 'expiring' | 'expired' | null;
}

const row: TestRow = { id: 23997, name: 'Example', status: 'ACTIVE', validity: 'valid' };

function cellProps<K extends keyof TestRow>(
  field: K,
  value: TestRow[K],
): GenericDataTableCellProps<TestRow, K> {
  return {
    row: { ...row, [field]: value },
    value,
    field,
    locale: 'en',
    notAvailable: '—',
    rowIndex: 0,
  };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ActiveArchivalStatusCell', () => {
  it('maps each domain value to its status type', () => {
    const { rerender } = render(<ActiveArchivalStatusCell {...cellProps('status', 'ACTIVE')} />);
    expect(screen.getByTestId('status')).toHaveAttribute('data-type', 'active');
    expect(screen.getByTestId('status')).toHaveTextContent('Active');

    rerender(<ActiveArchivalStatusCell {...cellProps('status', 'ARCHIVAL')} />);
    expect(screen.getByTestId('status')).toHaveAttribute('data-type', 'disabled');
    expect(screen.getByTestId('status')).toHaveTextContent('Archival');

    rerender(<ActiveArchivalStatusCell {...cellProps('status', null)} />);
    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('ValidityStatusCell', () => {
  it('maps each validity value to its status type', () => {
    const { rerender } = render(<ValidityStatusCell {...cellProps('validity', 'valid')} />);
    expect(screen.getByTestId('status')).toHaveTextContent('Valid');

    rerender(<ValidityStatusCell {...cellProps('validity', 'expiring')} />);
    expect(screen.getByTestId('status')).toHaveTextContent('Expiring soon');

    rerender(<ValidityStatusCell {...cellProps('validity', 'expired')} />);
    expect(screen.getByTestId('status')).toHaveTextContent('Expired');

    rerender(<ValidityStatusCell {...cellProps('validity', null)} />);
    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('UnderlinedTextCell', () => {
  it('derives the link URL from the row and falls back when the value is empty', () => {
    const { rerender } = render(
      <UnderlinedTextCell
        {...cellProps('name', 'Linked value')}
        href={(current) => `/customers/${current.id}`}
        openInNewTab
      />,
    );

    const link = screen.getByTestId('inline-link');
    expect(link).toHaveTextContent('Linked value');
    expect(link).toHaveAttribute('href', '/customers/23997');
    expect(link).toHaveAttribute('data-new-tab', 'true');

    rerender(<UnderlinedTextCell {...cellProps('name', null)} />);
    expect(screen.queryByTestId('inline-link')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
