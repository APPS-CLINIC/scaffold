import { useTranslation } from 'react-i18next';
import type { GenericDataTableCellProps } from '@/ui';
import type { Customer } from './customers.types';

export function CustomerNameCell({
  row,
  value,
}: GenericDataTableCellProps<Customer, 'customerFullName'>) {
  return (
    <div className="min-w-0">
      <span className="block font-semibold text-[var(--accent)]">{value}</span>
      {row.customerShortName !== value ? (
        <span className="mt-0.5 block text-xs text-[var(--muted)]">{row.customerShortName}</span>
      ) : null}
    </div>
  );
}

export function CustomerGridCell({ value }: GenericDataTableCellProps<Customer, 'grid'>) {
  return <span className="font-mono text-xs tracking-wide">{value}</span>;
}

export function CustomerStatusCell({
  value,
}: GenericDataTableCellProps<Customer, 'customerStatus'>) {
  const { t } = useTranslation();
  const active = value === 'active';

  return (
    <span
      className={
        active
          ? 'inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
          : 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
      }
    >
      <span
        aria-hidden="true"
        className={
          active ? 'size-2 rounded-full bg-emerald-600' : 'size-2 rounded-full bg-slate-400'
        }
      />
      {t(active ? 'customers.filters.active' : 'customers.filters.inactive')}
    </span>
  );
}

export function CustomerGroupCell({
  row,
  value,
}: GenericDataTableCellProps<Customer, 'corporateGroupName'>) {
  const { t } = useTranslation();

  if (!value) {
    return <span className="text-[var(--muted)]">{t('customers.value.notAvailable')}</span>;
  }

  return (
    <div className="min-w-0">
      <span className="block font-medium">{value}</span>
      {row.corporateGroupGRID ? (
        <span className="mt-0.5 block font-mono text-xs text-[var(--muted)]">
          {row.corporateGroupGRID}
        </span>
      ) : null}
    </div>
  );
}

export function CustomerSectorCell({
  value,
}: GenericDataTableCellProps<Customer, 'customerSector'>) {
  const { t } = useTranslation();
  return value ?? <span className="text-[var(--muted)]">{t('customers.value.notAvailable')}</span>;
}

type CustomerDateField =
  'dateReview' | 'ratingDt' | 'dateReviewExtension' | 'tsPriceConditionEndDt';

export function CustomerDateCell({
  value,
}: GenericDataTableCellProps<Customer, CustomerDateField>) {
  const { t, i18n } = useTranslation();

  if (!value) {
    return <span className="text-[var(--muted)]">{t('customers.value.notAvailable')}</span>;
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function CustomerPriceConditionCell({
  value,
}: GenericDataTableCellProps<Customer, 'tsPriceConditionStatus'>) {
  const { t } = useTranslation();

  switch (value) {
    case 'valid':
      return t('customers.priceCondition.valid');
    case 'expiring':
      return t('customers.priceCondition.expiring');
    case 'expired':
      return t('customers.priceCondition.expired');
    case null:
      return <span className="text-[var(--muted)]">{t('customers.value.notAvailable')}</span>;
    default:
      return value;
  }
}
