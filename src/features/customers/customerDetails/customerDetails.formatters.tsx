import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { daysPastIsoDate, formatIsoDmyDate, isPastIsoDate } from '@/i18n/dateFormats';
import { Status } from '@/ui';
import type { CustomerAddress } from './customerDetails.types';

function presentParts(parts: readonly (string | null)[]): string[] {
  return parts.filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
}

/** Join a street with the conventional `postal code city` locality fragment. */
function formatPostalAddress(address: CustomerAddress | null): string | null {
  if (!address) return null;

  const locality = presentParts([address.postalCode, address.city]).join(' ');
  const addressParts = presentParts([address.street, locality || null]);
  return addressParts.length > 0 ? addressParts.join(', ') : null;
}

function formatYesNo(value: boolean | null, labels: { yes: string; no: string }): string | null {
  if (value === null) return null;
  return value ? labels.yes : labels.no;
}

/** A date, with an IWA status on its own line above it when one is given. */
function dateWithStatus(
  value: string,
  formatted: string,
  statusLabel: string | null,
): ReactElement {
  if (statusLabel === null) return <time dateTime={value}>{formatted}</time>;

  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5">
      <Status type="incomplete" label={statusLabel} className="[&_*]:!text-sm [&_*]:!leading-5" />
      <time dateTime={value}>{formatted}</time>
    </span>
  );
}

export interface CustomerFormatters {
  date: (value: string | null) => string | null;
  yesNo: (value: boolean | null) => string | null;
  address: (value: CustomerAddress | null) => string | null;
  /** Localized date preceded by the IWA "Overdue" status when the date is in the past (CDD + FATCA rows). */
  expiry: (value: string | null) => ReactElement | null;
  /** Localized date preceded by how many days it is overdue when it is in the past (review dates). */
  reviewDate: (value: string | null) => ReactElement | null;
}

/** Binds the formatters above to the active locale and translations, once per render. */
export function useCustomerFormatters(): CustomerFormatters {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  return useMemo(
    () => ({
      date: (value: string | null) => (value ? formatIsoDmyDate(value, locale) : null),
      yesNo: (value: boolean | null) =>
        formatYesNo(value, { yes: t('common.yes'), no: t('common.no') }),
      address: formatPostalAddress,
      expiry: (value: string | null): ReactElement | null => {
        if (!value) return null;

        return dateWithStatus(
          value,
          formatIsoDmyDate(value, locale),
          isPastIsoDate(value) ? t('customers.details.compliance.status.overdue') : null,
        );
      },
      reviewDate: (value: string | null): ReactElement | null => {
        if (!value) return null;
        const daysPast = daysPastIsoDate(value);

        return dateWithStatus(
          value,
          formatIsoDmyDate(value, locale),
          daysPast !== null && daysPast > 0
            ? t('customers.details.reviews.overdueDays', { count: daysPast })
            : null,
        );
      },
    }),
    [locale, t],
  );
}
