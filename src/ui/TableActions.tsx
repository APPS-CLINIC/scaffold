import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { Download, Settings } from 'ing-react-icons';
import { Switch, twMerge } from 'iwa-react-components';
import { useTranslation } from 'react-i18next';
import { useCustomIcon } from './icon/useCustomIcon';

export interface TableActionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The owner supplies the expandable keys: visible records or every tree branch. */
  expandableKeys: readonly string[];
  expandedKeys: readonly string[];
  onExpandedKeysChange: (keys: readonly string[]) => void;
  onExport?: () => void;
  exportLabel?: string;
  onOpenSettings?: () => void;
}

const ACTION_CLASS_NAME =
  'group !cursor-pointer !whitespace-normal !text-[var(--muted)] break-words text-sm ![text-overflow:clip] hover:!text-[var(--muted)] [&_*]:pointer-events-none [&_*]:!cursor-pointer [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:!overflow-visible [&_*]:![text-overflow:clip] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]';

/** Data-shape-neutral list actions. Expansion policy and export belong to the owner. */
export const TableActions = forwardRef<HTMLDivElement, TableActionsProps>(function TableActions(
  {
    expandableKeys,
    expandedKeys,
    onExpandedKeysChange,
    onExport,
    exportLabel,
    onOpenSettings,
    className,
    ...rest
  },
  ref,
) {
  const { t } = useTranslation();
  const expanded =
    expandableKeys.length > 0 && expandableKeys.every((key) => expandedKeys.includes(key));
  const DownloadIcon = useCustomIcon(<Download />, { size: 'md', tone: 'neutral' });
  const SettingsIcon = useCustomIcon(<Settings />, { size: 'md', tone: 'neutral' });

  return (
    <div
      ref={ref}
      className={twMerge('flex flex-wrap items-center justify-end gap-4', className)}
      {...rest}
    >
      {onOpenSettings ? (
        <button type="button" className={ACTION_CLASS_NAME} onClick={onOpenSettings}>
          <SettingsIcon />
          <span className="underline group-hover:no-underline">{t('table.settings.open')}</span>
        </button>
      ) : null}
      {onExport ? (
        <button type="button" className={ACTION_CLASS_NAME} onClick={onExport}>
          <DownloadIcon />
          <span className="underline group-hover:no-underline">
            {exportLabel ?? t('customers.actions.export')}
          </span>
        </button>
      ) : null}
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-[var(--muted)]">
        <span>{t('customers.actions.expandAll')}</span>
        <Switch
          aria-label={t('customers.actions.expandAll')}
          checked={expanded}
          disabled={expandableKeys.length === 0}
          onChange={() => onExpandedKeysChange(expanded ? [] : expandableKeys)}
        />
      </label>
    </div>
  );
});
