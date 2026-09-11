import { useCustomIcon } from '@/ui/icon/useCustomIcon';
import { Download, Settings } from 'ing-react-icons';
import { useTranslation } from 'react-i18next';
import { Switch } from 'iwa-react-components';
import type { GenericTableSettingsProps } from '@/ui/GenericDataTable/GenericDataTable.types.ts';

const TOOLBAR_ACTION_CLASS_NAME =
  '!cursor-pointer underline !whitespace-normal !text-[#506579] break-words text-sm ![text-overflow:clip] hover:!text-[#506579] hover:!no-underline [&_*]:pointer-events-none [&_*]:!cursor-pointer [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:!no-underline [&_*]:!overflow-visible [&_*]:![text-overflow:clip]';

export function GenericTableSettings<T extends { id: number }>({
  dataContent,
  onExpandedRowKeysChange,
  expandedRowKeys,
  handleExport,
  onOpenSettings,
}: GenericTableSettingsProps<T>) {
  const { t } = useTranslation();
  const visibleRowKeys = (dataContent ?? []).map((customer) => String(customer.id));
  const allVisibleRowsExpanded =
    visibleRowKeys.length > 0 && visibleRowKeys.every((key) => expandedRowKeys.includes(key));

  const DownloadIcon = useCustomIcon(<Download />, { size: 'md', tone: 'neutral' });
  const SettingsIcon = useCustomIcon(<Settings />, { size: 'md', tone: 'neutral' });

  return (
    <div className="flex items-center justify-end gap-4">
      {onOpenSettings ? (
        <button
          type="button"
          className={`${TOOLBAR_ACTION_CLASS_NAME} rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]`}
          onClick={onOpenSettings}
        >
          <SettingsIcon className="-mr-1" /> {t('table.settings.open')}
        </button>
      ) : null}
      <span
        className={`${TOOLBAR_ACTION_CLASS_NAME} !outline-none focus:!outline-none focus-visible:!outline-none`}
        onClick={handleExport}
      >
        <DownloadIcon className="-mr-1" /> {t('customers.actions.export')}
      </span>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-[var(--muted)]">
        <span>{t('customers.actions.expandAll')}</span>
        <Switch
          aria-label={t('customers.actions.expandAll')}
          checked={allVisibleRowsExpanded}
          disabled={visibleRowKeys.length === 0}
          onChange={() => onExpandedRowKeysChange(allVisibleRowsExpanded ? [] : visibleRowKeys)}
        />
      </label>
    </div>
  );
}
