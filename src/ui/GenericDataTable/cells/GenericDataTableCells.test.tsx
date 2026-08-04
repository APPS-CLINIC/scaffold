import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import type { GenericDataTableCellProps } from '../GenericDataTable.types';
import { ActiveInactiveStatusCell } from './ActiveInactiveStatusCell';
import { DateCell } from './DateCell';
import { TextCell } from './TextCell';
import { UnderlinedTextCell } from './UnderlinedTextCell';
import { ValidityStatusCell } from './ValidityStatusCell';

interface TestRow {
  id: number;
  name: string | null;
  date: string | null;
  status: 'active' | 'inactive' | null;
  validity: 'valid' | 'expiring' | 'expired' | null;
}

const row: TestRow = {
  id: 1,
  name: 'Example',
  date: '2026-01-15',
  status: 'active',
  validity: 'valid',
};

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

describe('GenericDataTable cells', () => {
  it('renders text and link values with a safe empty fallback', () => {
    const { rerender } = render(<TextCell {...cellProps('name', 'Example')} />);
    expect(screen.getByText('Example')).toBeInTheDocument();

    rerender(<TextCell {...cellProps('name', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();

    rerender(<UnderlinedTextCell {...cellProps('name', 'Linked value')} />);
    expect(screen.getByText('Linked value')).toBeInTheDocument();

    rerender(<UnderlinedTextCell {...cellProps('name', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats dates for the provided locale and preserves invalid input', () => {
    const { rerender } = render(<DateCell {...cellProps('date', '2026-01-15')} />);
    const expectedDate = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-01-15T12:00:00'));
    expect(screen.getByText(expectedDate)).toBeInTheDocument();

    rerender(<DateCell {...cellProps('date', 'invalid')} />);
    expect(screen.getByText('invalid')).toBeInTheDocument();

    rerender(<DateCell {...cellProps('date', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders active and inactive statuses as a dedicated cell component', () => {
    const { rerender } = render(<ActiveInactiveStatusCell {...cellProps('status', 'active')} />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<ActiveInactiveStatusCell {...cellProps('status', 'inactive')} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    rerender(<ActiveInactiveStatusCell {...cellProps('status', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders validity statuses as a dedicated cell component', () => {
    const { rerender } = render(<ValidityStatusCell {...cellProps('validity', 'valid')} />);
    expect(screen.getByText('Valid')).toBeInTheDocument();

    rerender(<ValidityStatusCell {...cellProps('validity', 'expiring')} />);
    expect(screen.getByText('Expiring soon')).toBeInTheDocument();

    rerender(<ValidityStatusCell {...cellProps('validity', 'expired')} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();

    rerender(<ValidityStatusCell {...cellProps('validity', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
