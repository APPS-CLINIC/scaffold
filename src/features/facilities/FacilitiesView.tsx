import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import type { MessageKey } from '@/i18n/messages/pl';
import {
  DateRangeFilter,
  GenericSearch,
  getExpandableTreeKeys,
  pickTableFilters,
  replaceTableFilters,
  Switch,
  tableFilter,
  TableFilters,
  TreeDataTable,
  twMerge,
} from '@/ui';
import type { TableFilterField, TableFilterValues, TreeDataTableColumn } from '@/ui';
import { FacilityIndicators } from './FacilityIndicators';
import { FacilitySelectFilter } from './FacilitySelectFilter';
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

const FACILITY_GROUP_LABELS: Record<FacilityGroup, MessageKey> = {
  LENDING: 'facilities.group.lending',
  TFS: 'facilities.group.tfs',
  INTRADAY: 'facilities.group.intraday',
  INVESTMENT: 'facilities.group.investment',
  CARD: 'facilities.group.card',
  OTHER: 'facilities.group.other',
};

const AMOUNT_LABELS = {
  grantedMinor: 'facilities.amount.grantedMinor',
  utilizedMinor: 'facilities.amount.utilizedMinor',
  availableMinor: 'facilities.amount.availableMinor',
} as const satisfies Record<string, MessageKey>;

function allNodes(nodes: readonly FacilityNode[]): FacilityNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children)]);
}

function makeFilterFields(nodes: readonly FacilityNode[]): TableFilterField[] {
  return [
    {
      field: 'contractCurrency',
      labelKey: 'facilities.filter.contractCurrency',
      filter: tableFilter(FacilitySelectFilter, {
        options: ['PLN', 'EUR'].map((value) => ({ value, label: value })),
      }),
    },
    {
      field: 'facilityType',
      labelKey: 'facilities.filter.type',
      filter: tableFilter(FacilitySelectFilter, {
        options: [...new Set(allNodes(nodes).map((node) => node.data.type))]
          .sort()
          .map((value) => ({ value, label: value })),
      }),
    },
    {
      field: 'displayCurrency',
      labelKey: 'facilities.filter.displayCurrency',
      filter: tableFilter(FacilitySelectFilter, {
        options: [
          { value: 'original', labelKey: 'facilities.currency.original' },
          { value: 'EUR', label: 'EUR' },
          { value: 'PLN', label: 'PLN' },
        ],
      }),
    },
    {
      field: 'maxLevel',
      labelKey: 'facilities.filter.level',
      filter: tableFilter(FacilitySelectFilter, {
        options: [1, 2, 3, 4, 5, 6].map((level) => ({
          value: String(level),
          label: Array.from({ length: level }, (_, index) => index + 1).join(', '),
        })),
      }),
    },
    {
      field: 'commitment',
      labelKey: 'facilities.filter.commitment',
      filter: tableFilter(FacilitySelectFilter, {
        options: [
          { value: 'C', labelKey: 'facilities.commitment.committed' },
          { value: 'U', labelKey: 'facilities.commitment.uncommitted' },
        ],
      }),
    },
    {
      field: 'expiryDate',
      labelKey: 'facilities.table.expiryDate',
      filter: tableFilter(DateRangeFilter, {}),
    },
    {
      field: 'looDate',
      labelKey: 'facilities.table.looDate',
      filter: tableFilter(DateRangeFilter, {}),
    },
  ];
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
  const fields = useMemo(() => makeFilterFields(snapshot.nodes), [snapshot.nodes]);
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
  const allExpanded =
    branchKeys.length > 0 && branchKeys.every((key) => expandedKeys.includes(key));
  const contextKeys = new Set(result.contextKeys);
  const shownCurrency = result.filters.displayCurrency;
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
  const columns: TreeDataTableColumn<FacilityNode>[] = [
    {
      id: 'basic',
      header: t('facilities.table.basic'),
      width: 520,
      renderCell: (node) => (
        <div
          className={twMerge(
            'inline-flex max-w-full items-start gap-3 align-top',
            contextKeys.has(node.key) && 'text-[var(--muted)]',
          )}
        >
          <span
            className="pt-1 text-xs"
            aria-label={t('facilities.level', { level: node.businessLevel })}
          >
            {node.businessLevel}
          </span>
          <FacilityIndicators facility={node.data} onOpenRelated={onOpenRelated} />
          <div className="min-w-0 text-sm leading-5">
            <Link
              to={getFacilityHref(node.data)}
              className="font-bold underline"
              onKeyDown={(event) => event.stopPropagation()}
            >
              {node.data.number}
            </Link>
            <div>
              {t(node.data.status === 'ACTIVE' ? 'common.status.active' : 'common.status.archival')}
            </div>
            <div className="font-bold">{t(FACILITY_GROUP_LABELS[node.data.group])}</div>
            <div>{node.data.type}</div>
            <div>{node.data.commitment}</div>
            <div>{t('facilities.contractCurrency', { currency: node.data.contractCurrency })}</div>
            {contextKeys.has(node.key) ? (
              <div className="text-xs">{t('facilities.context')}</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: 'description',
      header: t('facilities.table.description'),
      width: 180,
      renderCell: (node) => node.data.description,
    },
    {
      id: 'expiryDate',
      header: t('facilities.table.expiryDate'),
      width: 115,
      renderCell: (node) =>
        node.data.expiryDate ? (
          <time dateTime={node.data.expiryDate}>
            {formatIsoDmyDate(node.data.expiryDate, locale)}
          </time>
        ) : (
          '–'
        ),
    },
    {
      id: 'looDate',
      header: t('facilities.table.looDate'),
      width: 115,
      renderCell: (node) =>
        node.data.looDate ? (
          <time dateTime={node.data.looDate}>{formatIsoDmyDate(node.data.looDate, locale)}</time>
        ) : (
          '–'
        ),
    },
    ...(['grantedMinor', 'utilizedMinor', 'availableMinor'] as const).map((field) => ({
      id: field,
      header: t(AMOUNT_LABELS[field]),
      width: 160,
      headerClassName: 'text-right',
      cellClassName: 'text-right tabular-nums',
      renderCell: (node: FacilityNode) => {
        const amounts = node.data.amounts[shownCurrency];
        return formatFacilityAmount(amounts[field], amounts.currency, locale);
      },
    })),
    {
      id: 'utilization',
      header: t('facilities.table.utilization'),
      width: 100,
      cellClassName: 'text-right tabular-nums',
      renderCell: (node) => {
        const value = node.data.amounts[shownCurrency].utilization;
        return value === null
          ? '–'
          : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(
              value,
            );
      },
    },
  ];

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
      <div className="my-4 flex flex-wrap items-center justify-between gap-4">
        <GenericSearch
          value={query.q}
          onSearch={(q) => setQuery({ q }, { replace: true, resetPage: false })}
          placeholder={t('customers.search.placeholder')}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          {t('customers.actions.expandAll')}
          <Switch
            aria-label={t('customers.actions.expandAll')}
            checked={allExpanded}
            disabled={branchKeys.length === 0}
            onChange={() => setExpandedKeys(allExpanded ? [] : branchKeys)}
          />
        </label>
      </div>
      <p role="status" className="sr-only">
        {t('facilities.results', { count: result.matchingCount })}
      </p>
      <TreeDataTable
        nodes={result.nodes}
        getKey={facilityNodeKey}
        getChildren={facilityNodeChildren}
        columns={columns}
        expandedKeys={expandedKeys}
        onExpandedKeysChange={setExpandedKeys}
        labels={{
          table: t('facilities.title'),
          expand: (node) => t('facilities.expand', { number: node.data.number }),
          collapse: (node) => t('facilities.collapse', { number: node.data.number }),
        }}
        noResults={t('facilities.noResults')}
      />
    </section>
  );
}
