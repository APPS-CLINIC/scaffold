import { useRef, useState, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  CustomizableDialog,
  DIALOG_CONTENT_CLASS_NAME,
  DIALOG_FOOTER_CLASS_NAME,
  DialogHeading,
  FocusOnOpen,
  RadioGroup,
  resolveVisibility,
} from '@/ui';

const EXPORT_DIALOG_CLASS_NAME = '!w-[420px] !max-w-[calc(100vw-2rem)]';
const EXPORT_DIALOG_CONTENT_CLASS_NAME = `${DIALOG_CONTENT_CLASS_NAME} !min-h-[296px]`;

/** Which customers the file holds: those the search and filters leave, or all of them. */
export type CustomerExportScope = 'filtered' | 'all';

interface CustomerExportDialogProps {
  /** Downloads the full customer list in the table's columns, for the picked scope. */
  onDownload: (scope: CustomerExportScope) => void;
  onCancel: () => void;
}

/**
 * Asks which customer list to download: the full list by the filters (picked first) or
 * without them. The list with limits is offered disabled, as the service does not serve it
 * yet. Mount it only while it is open.
 */
export function CustomerExportDialog({ onDownload, onCancel }: CustomerExportDialogProps) {
  const { t } = useTranslation();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [scope, setScope] = useState<CustomerExportScope>('filtered');

  const handleSetVisibility = (next: SetStateAction<boolean>) => {
    if (!resolveVisibility(next, true)) onCancel();
  };

  return (
    <CustomizableDialog
      visibility
      onSetVisibility={handleSetVisibility}
      className={EXPORT_DIALOG_CLASS_NAME}
      contentClassName={EXPORT_DIALOG_CONTENT_CLASS_NAME}
    >
      <FocusOnOpen target={() => actionsRef.current?.querySelector('button')} />
      <DialogHeading text={t('customers.export.title')} centered />
      <div className="flex-1 px-6 pb-6 pt-2">
        <RadioGroup
          label={t('customers.export.choice')}
          options={[
            { label: t('customers.export.fullList'), value: 'filtered' },
            { label: t('customers.export.fullListUnfiltered'), value: 'all' },
            { label: t('customers.export.withLimits'), value: 'withLimits', disabled: true },
          ]}
          selectedOption={scope}
          onChange={(value) => {
            if (value === 'filtered' || value === 'all') setScope(value);
          }}
        />
      </div>
      <div ref={actionsRef} className={`${DIALOG_FOOTER_CLASS_NAME} flex-col`}>
        <Button
          label={t('customers.export.download')}
          style="filled"
          size="medium"
          className="w-full justify-center"
          onClick={() => onDownload(scope)}
        />
        <Button
          label={t('customers.export.cancel')}
          style="outline"
          size="medium"
          className="w-full justify-center"
          onClick={onCancel}
        />
      </div>
    </CustomizableDialog>
  );
}
