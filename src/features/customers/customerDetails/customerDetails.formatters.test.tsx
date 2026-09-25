import { render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import { useCustomerFormatters } from './customerDetails.formatters';

const formatters = () => renderHook(() => useCustomerFormatters()).result.current;

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useCustomerFormatters().address', () => {
  it('joins only present address fragments', () => {
    const { address } = formatters();

    expect(address({ street: 'Main Street 123', postalCode: '00-001', city: 'Warsaw' })).toBe(
      'Main Street 123, 00-001 Warsaw',
    );
    expect(address({ street: null, postalCode: '00-001', city: 'Warsaw' })).toBe('00-001 Warsaw');
    expect(address({ street: '', postalCode: null, city: null })).toBeNull();
    expect(address(null)).toBeNull();
  });
});

describe('useCustomerFormatters().date', () => {
  it('formats with the active locale and preserves invalid backend values', () => {
    const expected = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2026-08-31T12:00:00'));
    const { date } = formatters();

    expect(date('2026-08-31')).toBe(expected);
    expect(date('not-a-date')).toBe('not-a-date');
    expect(date(null)).toBeNull();
  });
});

describe('useCustomerFormatters().yesNo', () => {
  it('localizes booleans without converting null into a negative answer', () => {
    const { yesNo } = formatters();

    expect(yesNo(true)).toBe('Yes');
    expect(yesNo(false)).toBe('No');
    expect(yesNo(null)).toBeNull();
  });
});

describe('useCustomerFormatters().expiry', () => {
  it('marks a past date as Overdue and keeps <time dateTime> on the formatted value', () => {
    const expectedDate = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2000-01-02T12:00:00'));

    render(<>{formatters().expiry('2000-01-02')}</>);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toHaveAttribute('datetime', '2000-01-02');
  });

  it('renders a future date without the Overdue badge', () => {
    const expectedDate = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date('2999-01-02T12:00:00'));

    render(<>{formatters().expiry('2999-01-02')}</>);

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toHaveAttribute('datetime', '2999-01-02');
  });

  it('returns null for a missing expiration date', () => {
    expect(formatters().expiry(null)).toBeNull();
  });
});

describe('useCustomerFormatters().reviewDate', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-24T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['2026-09-23', 'Zaległy 1 dzień'],
    ['2026-09-21', 'Zaległe 3 dni'],
    ['2026-09-02', 'Zaległe 22 dni'],
    ['2026-05-27', 'Zaległe 120 dni'],
  ])('marks %s with how many days it is overdue', async (value, label) => {
    await i18n.changeLanguage('pl');

    render(<>{formatters().reviewDate(value)}</>);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(formatIsoDmyDate(value, 'pl'))).toHaveAttribute('datetime', value);
  });

  it('words the count in English too', () => {
    render(<>{formatters().reviewDate('2026-09-23')}</>);

    expect(screen.getByText('Overdue 1 day')).toBeInTheDocument();
  });

  it.each(['2026-09-24', '2026-09-25'])('leaves %s unmarked', (value) => {
    render(<>{formatters().reviewDate(value)}</>);

    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
    expect(screen.getByText(formatIsoDmyDate(value, 'en'))).toHaveAttribute('datetime', value);
  });

  it('returns null for a missing date', () => {
    expect(formatters().reviewDate(null)).toBeNull();
  });
});
