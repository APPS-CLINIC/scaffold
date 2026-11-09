import { z } from 'zod';
import type { ListQuery } from '@/features/urlState/urlState.schema';
import { parseIsoDate } from '@/i18n/dateFormats';
import { FACILITY_GROUPS } from './facilities.types';
import type { FacilityGroup, FacilityNode } from './facilities.types';

const values = z.array(z.string()).catch([]);
const allowed = <T extends string>(options: readonly T[]) =>
  values.transform((items) =>
    items.filter((item): item is T => (options as readonly string[]).includes(item)),
  );
const day = values.transform((items) =>
  items.filter((item) => parseIsoDate(item) !== null).slice(0, 1),
);

export const facilityFiltersSchema = z
  .object({
    group: allowed(FACILITY_GROUPS),
    contractCurrency: allowed(['PLN', 'EUR']).transform((items) => items.slice(0, 1)),
    facilityType: values.transform((items) => items.slice(0, 1)),
    displayCurrency: allowed(['original', 'PLN', 'EUR']).transform(
      (items) => items[0] ?? 'original',
    ),
    maxLevel: allowed(['1', '2', '3', '4', '5', '6']).transform((items) => Number(items[0] ?? 6)),
    commitment: allowed(['C', 'U']).transform((items) => items.slice(0, 1)),
    'expiryDate.from': day,
    'expiryDate.to': day,
    'looDate.from': day,
    'looDate.to': day,
  })
  .transform((filters) => {
    for (const [fromParam, toParam] of [
      ['expiryDate.from', 'expiryDate.to'],
      ['looDate.from', 'looDate.to'],
    ] as const) {
      const from = filters[fromParam][0];
      const to = filters[toParam][0];
      if (from && to && from > to) {
        filters[fromParam] = [];
        filters[toParam] = [];
      }
    }
    return filters;
  });

export type FacilityFilters = z.output<typeof facilityFiltersSchema>;

/** The mock-up names Lending "including TFS"; overlapping choices remain a union. */
export function includesFacilityGroup(
  group: FacilityGroup,
  selection: readonly FacilityGroup[],
): boolean {
  return (
    selection.length === 0 ||
    selection.includes(group) ||
    (group === 'TFS' && selection.includes('LENDING'))
  );
}

function inRange(date: string | null, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  return date !== null && (!from || date >= from) && (!to || date <= to);
}

function matches(node: FacilityNode, search: string, filters: FacilityFilters): boolean {
  const row = node.data;
  const text = [row.number, row.description, row.type, row.status, row.group]
    .join(' ')
    .toLocaleLowerCase();
  return (
    (!search || text.includes(search)) &&
    includesFacilityGroup(row.group, filters.group) &&
    (!filters.contractCurrency.length || filters.contractCurrency.includes(row.contractCurrency)) &&
    (!filters.facilityType.length || filters.facilityType.includes(row.type)) &&
    (!filters.commitment.length || filters.commitment.includes(row.commitment)) &&
    inRange(row.expiryDate, filters['expiryDate.from'][0], filters['expiryDate.to'][0]) &&
    inRange(row.looDate, filters['looDate.from'][0], filters['looDate.to'][0])
  );
}

/** Strict tree filtering preserves ancestors only as context, including collapsed branches. */
export function filterFacilities(
  nodes: readonly FacilityNode[],
  query: Pick<ListQuery, 'q' | 'filters'>,
) {
  const filters = facilityFiltersSchema.parse(query.filters);
  const search = query.q.trim().toLocaleLowerCase();
  const contextKeys: string[] = [];
  const ancestorKeys: string[] = [];
  let matchingCount = 0;

  function visit(items: readonly FacilityNode[]): FacilityNode[] {
    return items.flatMap((node) => {
      if (node.businessLevel > filters.maxLevel) return [];
      const children = visit(node.children);
      const matched = matches(node, search, filters);
      if (!matched && !children.length) return [];
      if (matched) matchingCount++;
      else contextKeys.push(node.key);
      if (children.length) ancestorKeys.push(node.key);
      return [
        { ...node, children, hasChildren: children.length > 0, childrenCount: children.length },
      ];
    });
  }

  const result = visit(nodes);
  const hasConditions = Boolean(
    search ||
    filters.group.length ||
    filters.contractCurrency.length ||
    filters.facilityType.length ||
    filters.commitment.length ||
    filters.maxLevel < 6 ||
    filters['expiryDate.from'].length ||
    filters['expiryDate.to'].length ||
    filters['looDate.from'].length ||
    filters['looDate.to'].length,
  );
  return {
    nodes: result,
    filters,
    matchingCount,
    contextKeys,
    autoExpandedKeys: hasConditions ? ancestorKeys : [],
  };
}
