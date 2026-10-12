import { useRef, type SetStateAction } from 'react';
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

interface CustomerExportDialogProps {
  /** Downloads the full customer list, with the filters and columns the table uses. */
  onDownload: () => void;
  onCancel: () => void;
}

/**
 * Asks which customer list to download. Only the full list is available yet, so it stays
 * picked and the list with limits is offered disabled. Mount it only while it is open.
 */
export function CustomerExportDialog({ onDownload, onCancel }: CustomerExportDialogProps) {
  const { t } = useTranslation();
  const actionsRef = useRef<HTMLDivElement>(null);

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
            { label: t('customers.export.fullList'), value: 'fullList' },
            { label: t('customers.export.withLimits'), value: 'withLimits', disabled: true },
          ]}
          selectedOption="fullList"
        />
      </div>
      <div ref={actionsRef} className={`${DIALOG_FOOTER_CLASS_NAME} flex-col`}>
        <Button
          label={t('customers.export.download')}
          style="filled"
          size="medium"
          className="w-full justify-center"
          onClick={onDownload}
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
