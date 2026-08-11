import { createSelector } from '@reduxjs/toolkit';
import { z } from 'zod';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import type { ListQuery } from '@/features/urlState/urlState.schema';
import type { CustomerQuery } from './customers.types';

export const customerFiltersSchema = z.object({
  status: z.enum(['active', 'inactive']).or(z.literal('')).catch(''),
  type: z.string().max(200).catch(''),
});

export type CustomerFilters = z.infer<typeof customerFiltersSchema>;

export function parseCustomerFilters(filters: Readonly<Record<string, string>>): CustomerFilters {
  return customerFiltersSchema.parse(filters);
}

/** Update only customer-owned keys while preserving filters owned by another feature. */
export function updateCustomerUrlFilters(
  current: Readonly<Record<string, string>>,
  patch: Partial<CustomerFilters>,
): Record<string, string> {
  const next = { ...current };

  if (patch.status !== undefined) {
    if (patch.status) next.status = patch.status;
    else delete next.status;
  }

  if (patch.type !== undefined) {
    if (patch.type) next.type = patch.type;
    else delete next.type;
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
