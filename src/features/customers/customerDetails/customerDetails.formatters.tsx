import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import { Status } from '@/ui';
import type { CustomerAddress } from './customerDetails.types';

function presentParts(parts: readonly (string | null)[]): string[] {
  return parts.filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
}

/** Join a street with the conventional `postal code city` locality fragment. */
export function formatCustomerAddress(address: CustomerAddress | null): string | null {
  if (!address) return null;

  const locality = presentParts([address.postalCode, address.city]).join(' ');
  const addressParts = presentParts([address.street, locality || null]);
  return addressParts.length > 0 ? addressParts.join(', ') : null;
}

export function formatCustomerDate(value: string | null, locale: string): string | null {
  return value ? formatIsoDmyDate(value, locale) : null;
}

export function formatCustomerBoolean(
  value: boolean | null,
  labels: { yes: string; no: string },
): string | null {
  if (value === null) return null;
  return value ? labels.yes : labels.no;
}

/** Compare ISO local dates without timezone conversion. Unknown formats are not classified. */
export function isPastCustomerDate(value: string | null, today = new Date()): boolean {
  if (!value) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match) return false;

  const [, yearPart, monthPart, dayPart] = match;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsed = new Date(year, month - 1, day, 12);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return false;
  }

  const comparableDate = `${yearPart}-${monthPart}-${dayPart}`;
  const todayDate = [
    String(today.getFullYear()).padStart(4, '0'),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return comparableDate < todayDate;
}

export interface CustomerFormatters {
  date: (value: string | null) => string | null;
  yesNo: (value: boolean | null) => string | null;
  address: (value: CustomerAddress | null) => string | null;
  /** Localized date preceded by the IWA "Overdue" status when the date is in the past (CDD + FATCA rows). */
  expiry: (value: string | null) => ReactElement | null;
}

/** Binds the pure formatters above to the active locale/translations, once per render. */
export function useCustomerFormatters(): CustomerFormatters {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  return useMemo(
    () => ({
      date: (value: string | null) => formatCustomerDate(value, locale),
      yesNo: (value: boolean | null) =>
        formatCustomerBoolean(value, { yes: t('common.yes'), no: t('common.no') }),
      address: formatCustomerAddress,
      expiry: (value: string | null): ReactElement | null => {
        const formatted = formatCustomerDate(value, locale);
        if (!value || !formatted) return null;

        if (!isPastCustomerDate(value)) return <time dateTime={value}>{formatted}</time>;

        // Past dates lead with the vendor warning status on its own line, the date below it.
        return (
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <Status
              type="incomplete"
              label={t('customers.details.compliance.status.overdue')}
              className="[&_*]:!text-sm [&_*]:!leading-5"
            />
            <time dateTime={value}>{formatted}</time>
          </span>
        );
      },
    }),
    [locale, t],
  );
}
