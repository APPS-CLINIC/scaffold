import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import type { GenericDataTableCellProps } from '../GenericDataTable.types';
import { ActiveArchivalStatusCell } from './ActiveArchivalStatusCell';
import { OverdueDateCell } from './OverdueDateCell';
import { UnderlinedTextCell } from './UnderlinedTextCell';
import { renderWithProviders } from '@/test/renderWithProviders';

interface TestRow {
  id: number;
  name: string | null;
  status: 'ACTIVE' | 'ARCHIVAL' | null;
  date: string | null;
}

const row: TestRow = { id: 23997, name: 'Example', status: 'ACTIVE', date: null };

function Destination() {
  const location = useLocation();
  return <output aria-label="Destination">{location.pathname + location.search}</output>;
}

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
  it('labels each domain value and falls back for an empty one', () => {
    const { rerender } = render(<ActiveArchivalStatusCell {...cellProps('status', 'ACTIVE')} />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<ActiveArchivalStatusCell {...cellProps('status', 'ARCHIVAL')} />);
    expect(screen.getByText('Archival')).toBeInTheDocument();

    rerender(<ActiveArchivalStatusCell {...cellProps('status', null)} />);
    expect(screen.queryByText('Archival')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('UnderlinedTextCell', () => {
  it('follows an internal route by keyboard without reloading the page', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <UnderlinedTextCell
          {...cellProps('name', 'Facility')}
          to={(current) => `/facilities/${current.id}?group=TFS`}
        />
        <Destination />
      </>,
    );
    const link = screen.getByRole('link', { name: 'Facility' });
    expect(link).toHaveAttribute('href', '/facilities/23997?group=TFS');
    expect(link).toHaveClass('focus-visible:outline');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Destination' })).toHaveTextContent(
      '/facilities/23997?group=TFS',
    );
  });
  it('derives the link URL from the row and falls back when the value is empty', () => {
    const { rerender } = render(
      <UnderlinedTextCell
        {...cellProps('name', 'Linked value')}
        href={(current) => `/customers/${current.id}`}
        openInNewTab
      />,
    );

    const link = screen.getByRole('link', { name: 'Linked value' });
    expect(link).toHaveAttribute('href', '/customers/23997');
    expect(link).toHaveAttribute('target', '_blank');

    rerender(<UnderlinedTextCell {...cellProps('name', null)} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('OverdueDateCell', () => {
  const formatted = (isoDate: string) =>
    new Intl.DateTimeFormat('en', DATE_DMY_FORMAT_OPTIONS).format(new Date(`${isoDate}T12:00:00`));

  beforeEach(() => {
    // Overdue is measured against the real clock, so pin it. Only Date is faked:
    // React and Testing Library keep their real timers.
    vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00'), toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a future date and today like DateCell, without the marker', () => {
    const { rerender } = render(<OverdueDateCell {...cellProps('date', '2026-09-16')} />);
    expect(screen.getByText(formatted('2026-09-16'))).toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();

    rerender(<OverdueDateCell {...cellProps('date', '2026-09-15')} />);
    expect(screen.getByText(formatted('2026-09-15'))).toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('marks a past date as overdue above the date', () => {
    render(<OverdueDateCell {...cellProps('date', '2026-09-14')} />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText(formatted('2026-09-14'))).toHaveAttribute('datetime', '2026-09-14');
  });

  it('falls back like DateCell for empty and non-date values, never showing the marker', () => {
    const { rerender } = render(<OverdueDateCell {...cellProps('date', null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();

    rerender(<OverdueDateCell {...cellProps('date', '')} />);
    expect(screen.getByText('—')).toBeInTheDocument();

    rerender(<OverdueDateCell {...cellProps('date', '2026-02-31')} />);
    expect(screen.getByText('2026-02-31')).toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });
});
