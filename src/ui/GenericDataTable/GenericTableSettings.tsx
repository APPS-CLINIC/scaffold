import { useCustomIcon } from '@/ui/icon/useCustomIcon';
import { Download, Settings } from 'ing-react-icons';
import { useTranslation } from 'react-i18next';
import { ActionLink, Switch } from 'iwa-react-components';
import type { GenericTableSettingsProps } from '@/ui/GenericDataTable/GenericDataTable.types.ts';

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

  return (
    <div className="flex items-center justify-end gap-4">
      {onOpenSettings ? (
        <ActionLink icon={<Settings />} label={t('table.settings.open')} onClick={onOpenSettings} />
      ) : null}
      <span
        className="!cursor-pointer underline !whitespace-normal !text-[#506579] !outline-none break-words text-sm ![text-overflow:clip] hover:!text-[#506579] hover:!no-underline focus:!outline-none focus-visible:!outline-none [&_*]:pointer-events-none [&_*]:!cursor-pointer [&_*]:!whitespace-normal [&_*]:!break-words [&_*]:!no-underline [&_*]:!overflow-visible [&_*]:![text-overflow:clip]"
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
