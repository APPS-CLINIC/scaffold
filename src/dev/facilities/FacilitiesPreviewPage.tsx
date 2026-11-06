import { useMemo, useState } from 'react';
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
import { facilityPreviewSnapshot } from './facilities.fixture';

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
  const nodes = useMemo(() => flatten(facilityPreviewSnapshot.nodes), []);
  const selected = nodes.find((node) => node.data.id === facilityId);
  const shown = related?.facility ?? selected?.data;

  const close = () => {
    if (related) setRelated(null);
    else navigate('/dev/facilities' + search, { replace: true });
  };

  const downloadExample = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(facilityPreviewSnapshot, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'facilities-proposed-view-model.json';
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
        />
      </div>
      <FacilitiesView
        snapshot={facilityPreviewSnapshot}
        getFacilityHref={(facility) =>
          '/dev/facilities/' + encodeURIComponent(facility.id) + search
        }
        onOpenRelated={(facility, indicator) => setRelated({ facility, indicator })}
      />
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
