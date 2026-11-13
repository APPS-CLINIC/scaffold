import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import { useListQueryState } from '@/features/urlState/useListQueryState';
import { formatIsoDmyDate } from '@/i18n/dateFormats';
import type { MessageKey } from '@/i18n/messages/pl';
import {
  GenericSearch,
  ListToolbarSkeleton,
  getExpandableTreeKeys,
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
  filterFacilities,
  includesFacilityGroup,
} from './facilities.filters';
import { formatFacilityAmount, sumFacilitySummaries } from './facilities.formatters';
import {
  FACILITY_GROUPS,
  FACILITY_LEVELS,
  facilityNodeChildren,
  facilityNodeKey,
  facilityNodeHasChildren,
} from './facilities.types';
import type {
  FacilityGroup,
  FacilityIndicator,
  FacilityLevel,
  FacilityNode,
  FacilityRow,
  FacilitySnapshot,
} from './facilities.types';

const AMOUNT_LABELS = {
  grantedMinor: 'facilities.amount.grantedMinor',
  utilizedMinor: 'facilities.amount.utilizedMinor',
  availableMinor: 'facilities.amount.availableMinor',
} as const satisfies Record<string, MessageKey>;

const TOP_LEVEL = FACILITY_LEVELS[0];
// A literal tuple index: shortening FACILITY_LEVELS becomes a compile error here.
const DEEPEST_LEVEL = FACILITY_LEVELS[5];

/** "1, 2, 3": choosing a level opens the tree until every level down to it is visible. */
function levelLabel(level: FacilityLevel): string {
  return FACILITY_LEVELS.filter((item) => item <= level).join(', ');
}

function allNodes(nodes: readonly FacilityNode[]): FacilityNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children)]);
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
  /**
   * Lazy owners load the pages needed to open every branch above `level` and return the keys
   * to expand. Without it, the view opens the branches it already has.
   */
  onExpandToLevel?: (level: FacilityLevel, signal: AbortSignal) => Promise<readonly string[]>;
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
      [...new Set(allNodes(snapshot.nodes).map((node) => node.data.type))].sort(),
    [snapshot],
  );
  const { config, filterFields: fields } = useMemo(
    () =>
      createFacilityTableConfig({ getFacilityHref, onOpenRelated, facilityTypes, onLoadChildren }),
    [getFacilityHref, onOpenRelated, facilityTypes, onLoadChildren],
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
  const branchKeys = getExpandableTreeKeys(
    result.nodes,
    facilityNodeKey,
    facilityNodeChildren,
    facilityNodeHasChildren,
  );
  // The chip records the last level the tree was opened to. Manual toggles do not change it,
  // and a new query starts again from the top level like its expansion does.
  const [openLevel, setOpenLevel] = useState<{ queryKey: string; level: FacilityLevel } | null>(
    null,
  );
  const selectedLevel = openLevel?.queryKey === queryKey ? openLevel.level : TOP_LEVEL;
  const [expandingTo, setExpandingTo] = useState<FacilityLevel | null>(null);
  const expansionRequest = useRef(0);
  const expansionController = useRef<AbortController | null>(null);
  const levelBeforeExpanding = useRef<FacilityLevel>(TOP_LEVEL);
  const latestQueryKey = useRef(queryKey);
  latestQueryKey.current = queryKey;
  useEffect(() => {
    setExpandingTo(null);
    return () => {
      expansionController.current?.abort();
    };
  }, [queryKey]);
  const cancelExpanding = () => {
    expansionController.current?.abort();
    expansionRequest.current++;
    setExpandingTo(null);
    setOpenLevel({ queryKey, level: levelBeforeExpanding.current });
  };
  const openToLevel = async (level: FacilityLevel) => {
    const request = ++expansionRequest.current;
    expansionController.current?.abort();
    const forQuery = queryKey;
    // While another level is still loading, the last fully opened level stays the fallback.
    if (expandingTo === null) levelBeforeExpanding.current = selectedLevel;
    setOpenLevel({ queryKey: forQuery, level });
    if (level === TOP_LEVEL || !onExpandToLevel) {
      setExpandingTo(null);
      setExpandedKeys(
        level === DEEPEST_LEVEL
          ? branchKeys
          : allNodes(result.nodes)
              .filter((node) => node.hasChildren && node.businessLevel < level)
              .map((node) => node.key),
      );
      return;
    }
    const controller = new AbortController();
    expansionController.current = controller;
    setExpandingTo(level);
    try {
      const next = await onExpandToLevel(level, controller.signal);
      if (
        !controller.signal.aborted &&
        request === expansionRequest.current &&
        forQuery === latestQueryKey.current
      )
        setExpansion({ queryKey: forQuery, keys: next });
    } catch {
      // A failed branch exposes its retry control; the chip returns to the previous choice.
      if (request === expansionRequest.current)
        setOpenLevel({ queryKey: forQuery, level: levelBeforeExpanding.current });
    } finally {
      if (!controller.signal.aborted && request === expansionRequest.current) setExpandingTo(null);
    }
  };
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
        allNodes(snapshot.nodes).filter((node) => includesFacilityGroup(node.data.group, [group]))
          .length,
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
                  selected={selectedLevel === level}
                  disabled={loading}
                  onClick={() => {
                    void openToLevel(level);
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
                expandableKeys={loading ? [] : branchKeys}
                expandedKeys={loading ? [] : expandedKeys}
                allExpanded={
                  branchKeys.length > 0 &&
                  branchKeys.every((key) => expandedKeys.includes(key)) &&
                  !allNodes(result.nodes).some(
                    (node) =>
                      node.hasChildren &&
                      (node.childrenState !== 'loaded' || node.nextCursor !== null),
                  )
                }
                onExpandedKeysChange={(keys) => {
                  if (expandingTo === null)
                    void openToLevel(keys.length ? DEEPEST_LEVEL : TOP_LEVEL);
                }}
              />
            }
          />
        </>
      ) : (
        <ListToolbarSkeleton />
      )}
      {expandingTo !== null ? (
        <p role="status">
          {expandingTo === DEEPEST_LEVEL
            ? t('facilities.loadingAll')
            : t('facilities.loadingLevels', { levels: levelLabel(expandingTo) })}{' '}
          <button
            type="button"
            className="text-[var(--accent)] underline"
            onClick={cancelExpanding}
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
          if (row.childrenState === 'unloaded' || row.childrenState === 'error')
            void onLoadChildren?.(row.key).catch(() => undefined);
        }}
        config={config}
        expandedKeys={loading ? [] : expandedKeys}
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
