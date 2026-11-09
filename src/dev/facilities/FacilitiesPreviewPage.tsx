import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SetStateAction } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FacilitiesView } from '@/features/facilities';
import type { FacilityIndicator, FacilityNode, FacilityRow } from '@/features/facilities';
import {
  Button,
  CustomizableDialog,
  DIALOG_CONTENT_CLASS_NAME,
  DIALOG_FOOTER_CLASS_NAME,
  DialogHeading,
  resolveVisibility,
} from '@/ui';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectListQuery } from '@/features/urlState/urlState.selectors';
import {
  facilitiesPreviewApi,
  useGetFacilityPreviewRootsQuery,
  useLazyGetFacilityPreviewChildrenQuery,
} from './facilitiesPreview.api';
import { getFacilityPreviewDetail } from './facilitiesPreview.service';
import type { FacilityPreviewQuery } from './facilitiesPreview.service';

function flatten(nodes: readonly FacilityNode[]): FacilityNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

/** Development-only interactive PoC; no real customer, endpoint or summary request. */
export function FacilitiesPreviewPage() {
  const { t } = useTranslation();
  const { facilityId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [related, setRelated] = useState<{
    facility: FacilityRow;
    indicator: FacilityIndicator;
  } | null>(null);
  const dispatch = useAppDispatch();
  const listQuery = useAppSelector(selectListQuery);
  // Display currency is a presentation variant; it must not invalidate loaded branches.
  const requestKey = JSON.stringify({
    q: listQuery.q,
    filters: Object.fromEntries(
      Object.entries(listQuery.filters).filter(([key]) => key !== 'displayCurrency'),
    ),
  });
  // A currency-only URL change keeps the same service request and cached branches.
  const query = useMemo(() => JSON.parse(requestKey) as FacilityPreviewQuery, [requestKey]);
  const { currentData: data, isError, refetch } = useGetFacilityPreviewRootsQuery(query);
  const [fetchChildren] = useLazyGetFacilityPreviewChildrenQuery();
  const selected = facilityId ? getFacilityPreviewDetail(facilityId) : undefined;
  const readData = useCallback(
    () =>
      dispatch(
        (_dispatch, getState) =>
          facilitiesPreviewApi.endpoints.getFacilityPreviewRoots.select(query)(getState()).data,
      ),
    [dispatch, query],
  );
  const loadChildren = useCallback(
    async (key: string) => {
      const node = flatten(readData()?.snapshot.nodes ?? []).find((item) => item.key === key);
      if (!node?.hasChildren || (node.childrenState === 'loaded' && node.nextCursor === null))
        return;
      return fetchChildren({
        query,
        parentKey: key,
        cursor: node.nextCursor ?? undefined,
      }).unwrap();
    },
    [readData, query, fetchChildren],
  );
  const response = data?.response;
  const loadMoreRoots = useCallback(async () => {
    const cursor = readData()?.nextRootCursor;
    if (cursor) return fetchChildren({ query, parentKey: null, cursor }).unwrap();
  }, [readData, fetchChildren, query]);
  useEffect(() => {
    let active = true;
    const revealMatches = async () => {
      for (const key of [...(response?.view.autoExpandedKeys ?? [])].reverse()) {
        if (!active) return;
        await loadChildren(key);
      }
    };
    void revealMatches().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [response, loadChildren]);
  const expandAll = useCallback(
    async (signal: AbortSignal) => {
      while (readData()?.nextRootCursor) {
        signal.throwIfAborted();
        await loadMoreRoots();
      }
      const queue = [...(readData()?.snapshot.nodes ?? [])];
      const keys: string[] = [];
      for (let index = 0; index < queue.length; index++) {
        signal.throwIfAborted();
        const pending = queue[index];
        if (!pending?.hasChildren) continue;
        keys.push(pending.key);
        let current = flatten(readData()?.snapshot.nodes ?? []).find(
          (node) => node.key === pending.key,
        );
        while (current && (current.childrenState !== 'loaded' || current.nextCursor !== null)) {
          signal.throwIfAborted();
          await loadChildren(current.key);
          current = flatten(readData()?.snapshot.nodes ?? []).find(
            (node) => node.key === pending.key,
          );
        }
        queue.push(...(current?.children ?? []));
      }
      return keys;
    },
    [loadChildren, loadMoreRoots, readData],
  );
  const shown = related?.facility ?? selected?.data;

  const close = () => {
    if (related) setRelated(null);
    else navigate('/dev/facilities' + search, { replace: true });
  };

  const downloadExample = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data?.response, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'facilities-roots-response.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 mt-0 text-2xl text-[var(--navigation-accent)]">
            {t('facilities.demo.title')}
          </h1>
          <p className="m-0 text-sm text-[var(--muted)]">{t('facilities.demo.description')}</p>
        </div>
        <Button
          label={t('facilities.demo.download')}
          style="outline"
          size="medium"
          onClick={downloadExample}
          disabled={!data}
        />
      </div>
      {data ? (
        <FacilitiesView
          snapshot={data.snapshot}
          onLoadChildren={loadChildren}
          onExpandAll={expandAll}
          getFacilityHref={(facility) =>
            '/dev/facilities/' + encodeURIComponent(facility.id) + search
          }
          onOpenRelated={(facility, indicator) => setRelated({ facility, indicator })}
        />
      ) : isError ? (
        <p role="alert">
          {t('facilities.loadFailed')}{' '}
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
          >
            {t('customers.loading.tryAgain')}
          </button>
        </p>
      ) : (
        <p role="status">{t('common.loading')}</p>
      )}
      {data?.nextRootCursor ? (
        <div>
          {data.rootPageState === 'error' ? <p role="alert">{t('facilities.loadFailed')}</p> : null}
          <Button
            label={t('facilities.moreRoots')}
            style="outline"
            size="medium"
            disabled={data.rootPageState === 'loading'}
            onClick={() => {
              void loadMoreRoots().catch(() => undefined);
            }}
          />
        </div>
      ) : null}
      {shown || facilityId ? (
        <CustomizableDialog
          visibility
          onSetVisibility={(next: SetStateAction<boolean>) => {
            if (!resolveVisibility(next, true)) close();
          }}
          className="!w-[560px] !max-w-[calc(100vw-2rem)]"
          contentClassName={DIALOG_CONTENT_CLASS_NAME}
        >
          <DialogHeading
            text={
              shown
                ? t('facilities.demo.facility', { number: shown.number })
                : t('facilities.noResults')
            }
            divided
          />
          <div className="px-6 py-4">
            <p className="mt-0">{t('facilities.demo.formDescription')}</p>
            {related ? (
              <ul className="m-0 space-y-2 pl-4">
                {related.facility.indicators[related.indicator].map((entry, index) => (
                  <li key={String(index) + entry}>{entry}</li>
                ))}
              </ul>
            ) : shown ? (
              <dl className="m-0 grid grid-cols-2 gap-3 text-sm">
                <dt>{t('facilities.table.description')}</dt>
                <dd className="m-0">{shown.description}</dd>
                <dt>{t('facilities.filter.type')}</dt>
                <dd className="m-0">{shown.type}</dd>
                <dt>{t('facilities.filter.contractCurrency')}</dt>
                <dd className="m-0">{shown.contractCurrency}</dd>
                <dt>{t('facilities.filter.level')}</dt>
                <dd className="m-0">{selected?.businessLevel}</dd>
              </dl>
            ) : null}
          </div>
          <div className={DIALOG_FOOTER_CLASS_NAME + ' justify-end'}>
            <Button
              label={t('facilities.demo.close')}
              style="outline"
              size="medium"
              onClick={close}
            />
          </div>
        </CustomizableDialog>
      ) : null}
    </div>
  );
}
