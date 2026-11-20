import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  GenericDataTableCellProps,
  GenericDataTableFieldConfig,
} from '../GenericDataTable.types';
import { TableCell } from './TableCell';
import { DateCell } from './DateCell';

interface Row {
  id: string;
  date: string | null;
  privateData: { secret: string };
}
const row: Row = { id: 'example', date: '2026-11-06', privateData: { secret: 'hidden' } };
function CustomCell({ row, value, field, locale, rowIndex }: GenericDataTableCellProps<Row, 'id'>) {
  return <span>{[row.date, value, field, locale, rowIndex].join(' / ')}</span>;
}
const base = { row, locale: 'en', rowIndex: 4, notAvailable: 'Unavailable' };

describe('TableCell', () => {
  it('renders primitive values and uses the supplied fallback for an empty field', () => {
    const column: GenericDataTableFieldConfig<Row> = {
      field: 'date',
      labelKey: 'facilities.table.expiryDate',
      width: 100,
    };
    const { rerender } = render(<TableCell {...base} column={column} />);
    expect(screen.getByText('2026-11-06')).toBeInTheDocument();
    rerender(<TableCell {...base} row={{ ...row, date: null }} column={column} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('passes the selected field, complete row, locale and row index to a custom cell', () => {
    render(
      <TableCell
        {...base}
        column={{
          field: 'id',
          labelKey: 'facilities.table.basic',
          width: 100,
          component: CustomCell,
        }}
      />,
    );
    expect(screen.getByText('2026-11-06 / example / id / en / 4')).toBeInTheDocument();
  });

  it('uses the shared DateCell formatting and fallback without a table-specific path', () => {
    render(
      <TableCell
        {...base}
        locale="pl"
        column={{
          field: 'date',
          labelKey: 'facilities.table.expiryDate',
          width: 100,
          component: DateCell,
        }}
      />,
    );
    expect(screen.getByText('06.11.2026')).toBeInTheDocument();
  });
});
