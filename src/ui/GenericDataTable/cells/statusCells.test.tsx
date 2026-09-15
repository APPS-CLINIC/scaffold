import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { InlineLinkProps, StatusProps } from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import type { GenericDataTableCellProps } from '../GenericDataTable.types';
import { ActiveArchivalStatusCell } from './ActiveArchivalStatusCell';
import { UnderlinedTextCell } from './UnderlinedTextCell';

// The status type is a prop, not visible in what the components render, so these two
// are overridden to expose it. Spreading the module first keeps every other export the
// graph reaches; `importOriginal` resolves to the aliased double, not the real library.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  Status: ({ type, label }: StatusProps) => (
    <span data-testid="status" data-type={type}>
      {label}
    </span>
  ),
  InlineLink: ({ label, url, openInNewTab }: InlineLinkProps) => (
    <a data-testid="inline-link" href={url} data-new-tab={openInNewTab ? 'true' : undefined}>
      {label as ReactNode}
    </a>
  ),
}));

interface TestRow {
  id: number;
  name: string | null;
  status: 'ACTIVE' | 'ARCHIVAL' | null;
}

const row: TestRow = { id: 23997, name: 'Example', status: 'ACTIVE' };

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
