import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createCustomerResponseFixture } from '@/dev/previewData/customers.fixture';
import i18n from '@/i18n';
import { pl } from '@/i18n/messages/pl';
import type { GenericDataTableCellProps } from '@/ui';
import { mapCustomerResponse } from '../customers.adapter';
import type { Customer } from '../customers.types';
import { CustomerTypeCell } from './CustomerTypeCell';

function cellProps(value: Customer['type']): GenericDataTableCellProps<Customer, 'type'> {
  const row = { ...mapCustomerResponse(createCustomerResponseFixture(1, 'Example')), type: value };
  return { row, value, field: 'type', locale: 'en', notAvailable: '—', rowIndex: 0 };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CustomerTypeCell', () => {
  it('translates the customer type and falls back for null', () => {
    const { rerender } = render(<CustomerTypeCell {...cellProps('CORPORATE')} />);
    expect(screen.getByText('Corporate')).toBeInTheDocument();

    rerender(<CustomerTypeCell {...cellProps(null)} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('follows the active language', async () => {
    await i18n.changeLanguage('pl');
    render(<CustomerTypeCell {...cellProps('CORPORATE')} />);
    expect(screen.getByText(pl['customers.type.corporate'])).toBeInTheDocument();
  });
});
