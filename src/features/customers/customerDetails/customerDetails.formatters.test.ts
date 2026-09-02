import { describe, expect, it } from 'vitest';
import {
  formatCustomerAddress,
  formatCustomerBoolean,
  formatCustomerDate,
  isPastCustomerDate,
} from './customerDetails.formatters';

describe('customer detail formatters', () => {
  it('joins only present address fragments', () => {
    expect(
      formatCustomerAddress({ street: 'Main Street 123', postalCode: '00-001', city: 'Warsaw' }),
    ).toBe('Main Street 123, 00-001 Warsaw');
    expect(formatCustomerAddress({ street: null, postalCode: '00-001', city: 'Warsaw' })).toBe(
      '00-001 Warsaw',
    );
    expect(formatCustomerAddress({ street: '', postalCode: null, city: null })).toBeNull();
    expect(formatCustomerAddress(null)).toBeNull();
  });

  it('formats dates with the active locale and preserves invalid backend values', () => {
    const date = new Date('2026-08-31T12:00:00');
    expect(formatCustomerDate('2026-08-31', 'pl')).toBe(
      new Intl.DateTimeFormat('pl', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        date,
      ),
    );
    expect(formatCustomerDate('not-a-date', 'en')).toBe('not-a-date');
    expect(formatCustomerDate(null, 'pl')).toBeNull();
  });

  it('localizes booleans without converting null into a negative answer', () => {
    const labels = { yes: 'Yes', no: 'No' };
    expect(formatCustomerBoolean(true, labels)).toBe('Yes');
    expect(formatCustomerBoolean(false, labels)).toBe('No');
    expect(formatCustomerBoolean(null, labels)).toBeNull();
  });

  it('classifies only valid earlier ISO local dates as past', () => {
    const today = new Date('2026-09-02T12:00:00');
    expect(isPastCustomerDate('2026-09-01', today)).toBe(true);
    expect(isPastCustomerDate('2026-09-02', today)).toBe(false);
    expect(isPastCustomerDate('2026-09-03', today)).toBe(false);
    expect(isPastCustomerDate('unknown', today)).toBe(false);
    expect(isPastCustomerDate('2025-13-01', today)).toBe(false);
    expect(isPastCustomerDate('2025-02-31', today)).toBe(false);
  });
});
