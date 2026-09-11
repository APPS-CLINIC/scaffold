import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GenericDataTableCellProps } from '../GenericDataTable.types';
import { DateCell } from './DateCell';
import { TextCell } from './TextCell';
import { renderCellValue } from './cellValue';

// Cells whose module graph never reaches `@/ui`, so these assertions hold whatever
// the IWA package renders. The cells that do render IWA components are covered in
// statusCells.test.tsx.
interface TestRow {
  id: number;
  name: string | null;
  date: string | null;
}

const row: TestRow = { id: 1, name: 'Example', date: '2026-01-15' };

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

describe('renderCellValue', () => {
  it('falls back for every empty value', () => {
    expect(renderCellValue(null, '—')).toBe('—');
    expect(renderCellValue(undefined, '—')).toBe('—');
    expect(renderCellValue('', '—')).toBe('—');
  });

  it('stringifies primitives and falls back for anything else', () => {
    expect(renderCellValue(42, '—')).toBe('42');
    expect(renderCellValue(false, '—')).toBe('false');
    expect(renderCellValue({}, '—')).toBe('—');
  });
});

describe('TextCell', () => {
  it('renders text values with a safe empty fallback', () => {
    const { rerender } = render(<TextCell {...cellProps('name', 'Example')} />);
    expect(screen.getByText('Example')).toBeInTheDocument();

    rerender(<TextCell {...cellProps('name', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('DateCell', () => {
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
});
