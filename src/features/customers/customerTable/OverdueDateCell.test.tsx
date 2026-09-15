import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { GenericDataTableCellProps } from '@/ui';
import { OverdueDateCell } from './OverdueDateCell';

interface TestRow {
  id: number;
  date: string | null;
}

function cellProps(value: string | null): GenericDataTableCellProps<TestRow, 'date'> {
  return {
    row: { id: 1, date: value },
    value,
    field: 'date',
    locale: 'en',
    notAvailable: '—',
    rowIndex: 0,
  };
}

beforeEach(async () => {
  vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00'), toFake: ['Date'] });
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OverdueDateCell', () => {
  it('falls back like DateCell for empty values', () => {
    const { rerender } = render(<OverdueDateCell {...cellProps(null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();

    rerender(<OverdueDateCell {...cellProps('')} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('hands a date to OverdueDate, which flags the overdue ones', () => {
    const { rerender } = render(<OverdueDateCell {...cellProps('2026-09-10')} />);
    expect(screen.getByText('Overdue by 5 days')).toBeInTheDocument();
    expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-09-10');

    rerender(<OverdueDateCell {...cellProps('2026-09-16')} />);
    expect(screen.queryByText(/^Overdue by/)).not.toBeInTheDocument();
    expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-09-16');
  });
});
