import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import type { MessageKey } from '@/i18n/messages/pl';
import {
  GenericSearch,
  getExpandableTreeKeys,
  pickTableFilters,
  replaceTableFilters,
  TableFilters,
  TableActions,
  TableToolbar,
  TreeDataTable,
  twMerge,
} from '@/ui';
import type { TableFilterValues } from '@/ui';
import { createFacilityTableConfig } from './facilityTable.config';
import { FACILITY_GROUP_LABELS } from './facilityGroupLabels';
import {
  facilityTableRowChildren,
  facilityTableRowKey,
  toFacilityTableRows,
} from './facilityTable.types';
import { filterFacilities, includesFacilityGroup } from './facilities.filters';
import { formatFacilityAmount, sumFacilitySummaries } from './facilities.formatters';
import { FACILITY_GROUPS, facilityNodeChildren, facilityNodeKey } from './facilities.types';
import type {
  FacilityGroup,
  FacilityIndicator,
  FacilityNode,
  FacilityRow,
  FacilitySnapshot,
} from './facilities.types';

const AMOUNT_LABELS = {
  grantedMinor: 'facilities.amount.grantedMinor',
  utilizedMinor: 'facilities.amount.utilizedMinor',
  availableMinor: 'facilities.amount.availableMinor',
} as const satisfies Record<string, MessageKey>;

function allNodes(nodes: readonly FacilityNode[]): FacilityNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children)]);
}

export interface FacilitiesViewProps {
  snapshot: FacilitySnapshot;
  getFacilityHref: (facility: FacilityRow) => string;
  onOpenRelated: (facility: FacilityRow, indicator: FacilityIndicator) => void;
}

/** Full-tree presentation; the caller supplies data and destinations, the URL owns queries. */
export function FacilitiesView({ snapshot, getFacilityHref, onOpenRelated }: FacilitiesViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const query = useAppSelector(selectListQuery);
  const { setQuery } = useListQueryState();
  const result = useMemo(() => filterFacilities(snapshot.nodes, query), [snapshot.nodes, query]);
  const facilityTypes = useMemo(
    () => [...new Set(allNodes(snapshot.nodes).map((node) => node.data.type))].sort(),
    [snapshot.nodes],
  );
  const { config, filterFields: fields } = useMemo(
    () => createFacilityTableConfig({ getFacilityHref, onOpenRelated, facilityTypes }),
    [getFacilityHref, onOpenRelated, facilityTypes],
  );
  const queryKey = JSON.stringify({
    q: query.q,
    filters: { ...result.filters, displayCurrency: undefined },
  });
  const [expansion, setExpansion] = useState<{ queryKey: string; keys: readonly string[] } | null>(
    null,
  );
  const expandedKeys = expansion?.queryKey === queryKey ? expansion.keys : result.autoExpandedKeys;
  const setExpandedKeys = (keys: readonly string[]) => setExpansion({ queryKey, keys });
  const branchKeys = getExpandableTreeKeys(result.nodes, facilityNodeKey, facilityNodeChildren);
  const shownCurrency = result.filters.displayCurrency;
  const tableRows = useMemo(
    () => toFacilityTableRows(result.nodes, shownCurrency, new Set(result.contextKeys)),
    [result.nodes, shownCurrency, result.contextKeys],
  );
  const summaryCurrency = shownCurrency === 'original' ? 'EUR' : shownCurrency;
  const selectedSummaries = snapshot.summaries.filter((summary) =>
    includesFacilityGroup(summary.group, result.filters.group),
  );
  const summary = sumFacilitySummaries(selectedSummaries, summaryCurrency);
  const groupCounts = Object.fromEntries(
    FACILITY_GROUPS.map((group) => [
      group,
      allNodes(snapshot.nodes).filter((node) => includesFacilityGroup(node.data.group, [group]))
        .length,
    ]),
  );
  const ownedValues: TableFilterValues = {
    contractCurrency: result.filters.contractCurrency.slice(0, 1),
    facilityType: result.filters.facilityType.slice(0, 1),
    commitment: result.filters.commitment.slice(0, 1),
    displayCurrency: query.filters.displayCurrency ? [shownCurrency] : [],
    maxLevel: query.filters.maxLevel ? [String(result.filters.maxLevel)] : [],
    'expiryDate.from': result.filters['expiryDate.from'],
    'expiryDate.to': result.filters['expiryDate.to'],
    'looDate.from': result.filters['looDate.from'],
    'looDate.to': result.filters['looDate.to'],
  };
  function changeGroups(group: FacilityGroup | null) {
    const current = result.filters.group;
    const next =
      group === null
        ? []
        : current.includes(group)
          ? current.filter((item) => item !== group)
          : [...current, group];
    setQuery({ filters: { ...query.filters, group: next } }, { resetPage: false });
  }

  return (
    <section aria-labelledby="facilities-title" className="min-w-0 rounded bg-[var(--surface)] p-5">
      <h2 id="facilities-title" className="m-0 text-lg font-bold">
        {t('facilities.title')}
      </h2>
      <p className="mb-6 mt-2 text-sm">
        {t('customers.dataAsOf')}{' '}
        <time dateTime={snapshot.asOf}>{formatIsoDmyDate(snapshot.asOf, locale)}</time>
      </p>
      <div role="group" aria-label={t('facilities.groups')} className="mb-6 flex flex-wrap gap-2">
        {[null, ...FACILITY_GROUPS].map((group) => {
          const selected =
            group === null
              ? result.filters.group.length === 0
              : result.filters.group.includes(group);
          return (
            <button
              key={group ?? 'all'}
              type="button"
              aria-pressed={selected}
              className={twMerge(
                'rounded-full border border-[var(--accent)] px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]',
                selected
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--accent)]',
              )}
              onClick={() => changeGroups(group)}
            >
              {selected ? (
                <span aria-hidden="true" className="mr-1">
                  ✓
                </span>
              ) : null}
              {group === null
                ? t('facilities.group.all')
                : t(FACILITY_GROUP_LABELS[group]) + ' (' + groupCounts[group] + ')'}
            </button>
          );
        })}
      </div>
      <section
        aria-label={t('facilities.summary.title')}
        className="mb-6 rounded bg-[var(--surface-muted)] p-4"
      >
        <h3 className="mb-3 mt-0 text-base font-bold">{t('facilities.summary.title')}</h3>
        <dl className="m-0 grid gap-4 sm:grid-cols-3">
          {(['grantedMinor', 'utilizedMinor', 'availableMinor'] as const).map((field) => (
            <div key={field}>
              <dt className="text-sm text-[var(--muted)]">{t(AMOUNT_LABELS[field])}</dt>
              <dd className="m-0 mt-1 font-bold tabular-nums">
                {formatFacilityAmount(summary[field], summary.currency, locale)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <TableToolbar
        filters={
          <TableFilters
            fields={fields}
            values={pickTableFilters(ownedValues, fields)}
            onChange={(next) =>
              setQuery(
                { filters: replaceTableFilters(query.filters, fields, next) },
                { resetPage: false },
              )
            }
          />
        }
        search={
          <GenericSearch
            value={query.q}
            onSearch={(q) => setQuery({ q }, { replace: true, resetPage: false })}
            placeholder={t('customers.search.placeholder')}
          />
        }
        actions={
          <TableActions
            expandableKeys={branchKeys}
            expandedKeys={expandedKeys}
            onExpandedKeysChange={setExpandedKeys}
          />
        }
      />
      <p role="status" className="sr-only">
        {t('facilities.results', { count: result.matchingCount })}
      </p>
      <TreeDataTable
        nodes={tableRows}
        getKey={facilityTableRowKey}
        getChildren={facilityTableRowChildren}
        config={config}
        expandedKeys={expandedKeys}
        onExpandedKeysChange={setExpandedKeys}
        labels={{
          table: t('facilities.title'),
          notAvailable: '–',
          expand: (node) => t('facilities.expand', { number: node.number }),
          collapse: (node) => t('facilities.collapse', { number: node.number }),
        }}
        noResults={t('facilities.noResults')}
      />
    </section>
  );
}
