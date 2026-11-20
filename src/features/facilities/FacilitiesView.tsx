import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import type { MessageKey } from '@/i18n/messages/pl';
import {
  GenericSearch,
  ListToolbarSkeleton,
  pickTableFilters,
  replaceTableFilters,
  TableFilters,
  TableActions,
  TableToolbar,
  TreeDataTable,
} from '@/ui';
import type { TableFilterValues, TreeDataTableProps } from '@/ui';
import { FacilityChip } from './FacilityChip';
import { createFacilityTableConfig } from './facilityTable.config';
import { FACILITY_GROUP_LABELS } from './facilityGroupLabels';
import {
  facilityTableRowChildren,
  facilityTableRowKey,
  facilityTableRowHasChildren,
  facilityTableRowChildrenLoading,
  toFacilityTableRows,
} from './facilityTable.types';
import type { FacilityTableRow } from './facilityTable.types';
import {
  facilityFiltersSchema,
  facilityQueryKey,
  filterFacilities,
  includesFacilityGroup,
} from './facilities.filters';
import { formatFacilityAmount, sumFacilitySummaries } from './facilities.formatters';
import {
  DEEPEST_FACILITY_LEVEL,
  FACILITY_GROUPS,
  FACILITY_LEVELS,
  FACILITY_LOAD_STATE,
  allFacilityNodes,
} from './facilities.types';
import type {
  FacilityGroup,
  FacilityIndicator,
  FacilityLevel,
  FacilityRow,
  FacilitySnapshot,
} from './facilities.types';
import { useFacilityTreeExpansion } from './useFacilityTreeExpansion';
import type { FacilityTreeExpansionOptions } from './useFacilityTreeExpansion';

const AMOUNT_LABELS = {
  grantedMinor: 'facilities.amount.grantedMinor',
  utilizedMinor: 'facilities.amount.utilizedMinor',
  availableMinor: 'facilities.amount.availableMinor',
} as const satisfies Record<string, MessageKey>;

/** "1, 2, 3": choosing a level opens the tree until every level down to it is visible. */
function levelLabel(level: FacilityLevel): string {
  return FACILITY_LEVELS.filter((item) => item <= level).join(', ');
}

export interface FacilitiesViewProps extends Pick<
  TreeDataTableProps<FacilityTableRow>,
  'loading' | 'loadingMore'
> {
  snapshot: FacilitySnapshot;
  toolbarReady?: boolean;
  getFacilityHref: (facility: FacilityRow) => string;
  onOpenRelated: (facility: FacilityRow, indicator: FacilityIndicator) => void;
  onLoadChildren?: (key: string) => Promise<unknown>;
  onExpandToLevel?: FacilityTreeExpansionOptions['onExpandToLevel'];
}

/** Loaded-hierarchy presentation; the owner supplies data/loading intents, the URL owns queries. */
export function FacilitiesView({
  snapshot,
  loading = false,
  loadingMore = false,
  toolbarReady = true,
  getFacilityHref,
  onOpenRelated,
  onLoadChildren,
  onExpandToLevel,
}: FacilitiesViewProps) {
  const { t, i18n } = useTranslation();
  const headingId = useId();
  const levelLabelId = useId();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const query = useAppSelector(selectListQuery);
  const { setQuery } = useListQueryState();
  const result = useMemo(
    () =>
      snapshot.view
        ? {
            nodes: snapshot.nodes,
            filters: facilityFiltersSchema.parse(query.filters),
            ...snapshot.view,
          }
        : filterFacilities(snapshot.nodes, query),
    [snapshot, query],
  );
  const facilityTypes = useMemo(
    () =>
      snapshot.view?.facilityTypes ??
      [...new Set(allFacilityNodes(snapshot.nodes).map((node) => node.data.type))].sort(),
    [snapshot],
  );
  const { config, filterFields: fields } = useMemo(
    () =>
      createFacilityTableConfig({ getFacilityHref, onOpenRelated, facilityTypes, onLoadChildren }),
    [getFacilityHref, onOpenRelated, facilityTypes, onLoadChildren],
  );
  const tree = useFacilityTreeExpansion({
    queryKey: facilityQueryKey(query.q, result.filters),
    nodes: result.nodes,
    autoExpandedKeys: result.autoExpandedKeys,
    onExpandToLevel,
  });
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
  const groupCounts =
    snapshot.view?.groupCounts ??
    Object.fromEntries(
      FACILITY_GROUPS.map((group) => [
        group,
        allFacilityNodes(snapshot.nodes).filter((node) =>
          includesFacilityGroup(node.data.group, [group]),
        ).length,
      ]),
    );
  const ownedValues: TableFilterValues = {
    contractCurrency: result.filters.contractCurrency.slice(0, 1),
    facilityType: result.filters.facilityType.slice(0, 1),
    commitment: result.filters.commitment.slice(0, 1),
    displayCurrency: query.filters.displayCurrency ? [shownCurrency] : [],
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
    <section aria-labelledby={headingId} className="min-w-0 rounded bg-[var(--surface)] p-5">
      <h2 id={headingId} className="m-0 text-lg font-bold">
        {t('facilities.title')}
      </h2>
      {toolbarReady ? (
        <>
          <p className="mb-6 mt-2 text-sm">
            {t('customers.dataAsOf')}{' '}
            <time dateTime={snapshot.asOf}>{formatIsoDmyDate(snapshot.asOf, locale)}</time>
          </p>
          <div
            role="group"
            aria-label={t('facilities.groups')}
            className="mb-6 flex flex-wrap gap-2"
          >
            {[null, ...FACILITY_GROUPS].map((group) => (
              <FacilityChip
                key={group ?? 'all'}
                selected={
                  group === null
                    ? result.filters.group.length === 0
                    : result.filters.group.includes(group)
                }
                onClick={() => changeGroups(group)}
              >
                {group === null
                  ? t('facilities.group.all')
                  : t(FACILITY_GROUP_LABELS[group]) + ' (' + groupCounts[group] + ')'}
              </FacilityChip>
            ))}
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
          <div className="mb-6">
            <p id={levelLabelId} className="mb-2 mt-0 text-sm font-bold">
              {t('facilities.filter.level')}
            </p>
            <div role="group" aria-labelledby={levelLabelId} className="flex flex-wrap gap-2">
              {FACILITY_LEVELS.map((level) => (
                <FacilityChip
                  key={level}
                  selected={tree.selectedLevel === level}
                  disabled={loading}
                  onClick={() => {
                    void tree.openToLevel(level);
                  }}
                >
                  {levelLabel(level)}
                </FacilityChip>
              ))}
            </div>
          </div>
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
                expandableKeys={loading ? [] : tree.branchKeys}
                expandedKeys={loading ? [] : tree.expandedKeys}
                allExpanded={tree.allExpanded}
                onExpandedKeysChange={(keys) => tree.setAllExpanded(keys.length > 0)}
              />
            }
          />
        </>
      ) : (
        <ListToolbarSkeleton />
      )}
      {tree.expandingTo !== null ? (
        <p role="status">
          {tree.expandingTo === DEEPEST_FACILITY_LEVEL
            ? t('facilities.loadingAll')
            : t('facilities.loadingLevels', { levels: levelLabel(tree.expandingTo) })}{' '}
          <button
            type="button"
            className="text-[var(--accent)] underline"
            onClick={tree.cancelExpanding}
          >
            {t('facilities.cancelLoadingAll')}
          </button>
        </p>
      ) : null}
      {!loading ? (
        <p role="status" className="sr-only">
          {t('facilities.results', { count: result.matchingCount })}
        </p>
      ) : null}
      <TreeDataTable<FacilityTableRow>
        nodes={tableRows}
        getKey={facilityTableRowKey}
        getChildren={facilityTableRowChildren}
        getHasChildren={facilityTableRowHasChildren}
        getChildrenLoading={facilityTableRowChildrenLoading}
        loading={loading}
        loadingMore={loadingMore}
        loadingLabel={t('common.loading')}
        onExpand={(row: FacilityTableRow) => {
          if (
            row.childrenState === FACILITY_LOAD_STATE.unloaded ||
            row.childrenState === FACILITY_LOAD_STATE.error
          )
            void onLoadChildren?.(row.key).catch(() => undefined);
        }}
        config={config}
        expandedKeys={loading ? [] : tree.expandedKeys}
        onExpandedKeysChange={tree.setExpandedKeys}
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
