import { createSelector } from '@reduxjs/toolkit';
import { z } from 'zod';
import type { RootState } from '@/app/store';
import { selectStoredTableColumns } from '@/features/tableSettings/tableSettings.selectors';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import type { ListQuery } from '@/features/urlState/urlState.schema';
import { parseIsoDate } from '@/i18n/dateFormats';
import {
  pickTableFilters,
  resolveColumnFields,
  type TableFilterField,
  type TableFilterValues,
} from '@/ui';
import { customerTableConfig } from './customerTable';
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  TS_PRICE_CONDITION_STATUSES,
  type CustomerQuery,
} from './customers.types';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const paramValues = z.array(z.string()).catch([]);

const enumParam = <T extends string>(allowed: readonly T[]) =>
  paramValues.transform((values) =>
    values.filter((value): value is T => (allowed as readonly string[]).includes(value)),
  );

const idParam = paramValues.transform((values) => values.filter((value) => ID_PATTERN.test(value)));

/** One `yyyy-MM-dd` day. */
const dayParam = paramValues.transform((values) =>
  values.filter((value) => parseIsoDate(value) !== null).slice(0, 1),
);

const textParam = paramValues.transform((values) => {
  const text = values[0]?.trim();
  return text ? [text] : [];
});

const DATE_RANGE_PARAMS = [
  'lendingReviewDate',
  'lendingRatingReviewDate',
  'tsPriceConditionEndDate',
] as const;

type DateRangeParams = Record<`${(typeof DATE_RANGE_PARAMS)[number]}.${'from' | 'to'}`, string[]>;

/** A range whose start lies after its end matches nothing, so it is no filter. */
function dropReversedRanges<F extends DateRangeParams>(filters: F): F {
  const result = { ...filters };
  for (const param of DATE_RANGE_PARAMS) {
    const [from] = result[`${param}.from`];
    const [to] = result[`${param}.to`];
    if (from !== undefined && to !== undefined && from > to) {
      result[`${param}.from`] = [];
      result[`${param}.to`] = [];
    }
  }
  return result;
}

/** The filter params the customer list endpoint reads, by the names the URL and the service share. */
export const customerFiltersSchema = z
  .object({
    status: enumParam(CUSTOMER_STATUSES),
    internalGroupId: idParam,
    corporateGroupId: idParam,
    type: enumParam(CUSTOMER_TYPES),
    'lendingReviewDate.from': dayParam,
    'lendingReviewDate.to': dayParam,
    'lendingRatingReviewDate.from': dayParam,
    'lendingRatingReviewDate.to': dayParam,
    lendingRating: textParam,
    'tsPriceConditionEndDate.from': dayParam,
    'tsPriceConditionEndDate.to': dayParam,
    tsPriceConditionStatus: enumParam(TS_PRICE_CONDITION_STATUSES),
    rmAdvisor: idParam,
    lendingAdvisor: idParam,
    sfAdvisor: idParam,
    pcmAdvisor: idParam,
    fmAdvisor: idParam,
    tsAdvisor: idParam,
    implementationAdvisor: idParam,
    customerServiceAdvisor: idParam,
    ebdAdvisor: idParam,
    lendingTeam: idParam,
  })
  .transform(dropReversedRanges);

/** Validated customer filters; an empty list is no filter. */
export type CustomerFilters = z.output<typeof customerFiltersSchema>;

export function parseCustomerFilters(filters: TableFilterValues): CustomerFilters {
  return customerFiltersSchema.parse(filters);
}

/**
 * Convert generic, validated list state into customer endpoint arguments. Only the filters
 * of `fields` — the fields the table uses — reach the endpoint.
 */
export function toCustomerQuery(
  listQuery: ListQuery,
  fields: readonly Pick<TableFilterField, 'field' | 'filterParam'>[],
): CustomerQuery {
  const { filters, ...baseQuery } = listQuery;
  return { ...baseQuery, filters: parseCustomerFilters(pickTableFilters(filters, fields)) };
}

/** The customer table fields in use, after the user's column settings. */
export const selectCustomerTableFields = createSelector(
  [(state: RootState) => selectStoredTableColumns(state, customerTableConfig.id)],
  (stored) => resolveColumnFields(customerTableConfig.fields, stored),
);

/** Validated customer endpoint arguments derived from the Redux URL mirror. */
export const selectCustomerQuery = createSelector(
  [selectListQuery, selectCustomerTableFields],
  toCustomerQuery,
);
