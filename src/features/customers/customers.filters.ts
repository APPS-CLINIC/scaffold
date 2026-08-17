import { createSelector } from '@reduxjs/toolkit';
import { z } from 'zod';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import type { ListQuery } from '@/features/urlState/urlState.schema';
import type { TableFilterValue, TableFilterValues } from '@/ui';
import type { CustomerQuery } from './customers.types';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(''))
  .catch('');

export const customerFiltersSchema = z.object({
  status: z.enum(['active', 'archival']).or(z.literal('')).catch(''),
  type: z.string().max(200).catch(''),
  lendingRatingReviewDateFrom: isoDate,
  lendingRatingReviewDateTo: isoDate,
  tsPriceConditionEndDateFrom: isoDate,
  tsPriceConditionEndDateTo: isoDate,
  lendingReviewDateFrom: isoDate,
  lendingReviewDateTo: isoDate,
});

export type CustomerFilters = z.infer<typeof customerFiltersSchema>;

export function parseCustomerFilters(filters: Readonly<Record<string, string>>): CustomerFilters {
  return customerFiltersSchema.parse(filters);
}

/** Update only customer-owned keys while preserving filters owned by another feature. */
const customerFilterKeys = Object.keys(customerFiltersSchema.shape) as (keyof CustomerFilters)[];

export function updateCustomerUrlFilters(
  current: Readonly<Record<string, string>>,
  patch: Partial<CustomerFilters>,
): Record<string, string> {
  const next = { ...current };

  for (const key of customerFilterKeys) {
    const value = patch[key];
    if (value === undefined) continue;
    if (value) next[key] = value;
    else delete next[key];
  }

  return next;
}

/** Convert generic, validated list state into customer endpoint arguments. */
export function toCustomerQuery(listQuery: ListQuery): CustomerQuery {
  const { filters, ...baseQuery } = listQuery;
  return { ...baseQuery, ...parseCustomerFilters(filters) };
}

/** Validated customer endpoint arguments derived from the Redux URL mirror. */
export const selectCustomerQuery = createSelector([selectListQuery], toCustomerQuery);

const dateRangeFilterFields = [
  'lendingRatingReviewDate',
  'tsPriceConditionEndDate',
  'lendingReviewDate',
] as const;

/** Applied feature filters, shaped for the generic TableFilterBar. */
export function customerFiltersToTableValues(filters: CustomerFilters): TableFilterValues {
  const values: Record<string, TableFilterValue> = {};

  if (filters.status) values.status = filters.status;
  if (filters.type) values.type = filters.type;

  for (const field of dateRangeFilterFields) {
    const from = filters[`${field}From`];
    const to = filters[`${field}To`];
    if (from || to) values[field] = { ...(from ? { from } : {}), ...(to ? { to } : {}) };
  }

  return values;
}

/**
 * The full filter patch derived from the TableFilterBar payload; every
 * customer-owned key is present, with '' clearing its URL param.
 */
export function tableValuesToCustomerFilterPatch(values: TableFilterValues): CustomerFilters {
  const flat: Record<string, string> = {};

  if (typeof values.status === 'string') flat.status = values.status;
  if (typeof values.type === 'string') flat.type = values.type;

  for (const field of dateRangeFilterFields) {
    const value = values[field];
    if (typeof value === 'object' && value !== null) {
      flat[`${field}From`] = value.from ?? '';
      flat[`${field}To`] = value.to ?? '';
    }
  }

  return customerFiltersSchema.parse(flat);
}
