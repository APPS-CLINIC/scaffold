import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, twMerge } from 'iwa-react-components';
import { useTranslation } from 'react-i18next';
import type { GenericDataTableField, TableColumnOption } from '../GenericDataTable.types';
import type { ColumnDraftRow } from './columnSettingsDraft';

export interface SortableColumnRowProps<T extends object> {
  row: ColumnDraftRow<GenericDataTableField<T>>;
  /** 1-based, for the accessible names of the row controls. */
  position: number;
  /** Fields this row may pick, in configuration order. */
  options: readonly TableColumnOption<T>[];
  invalid: boolean;
  removable: boolean;
  onFieldChange: (field: GenericDataTableField<T> | null) => void;
  onRemove: () => void;
}

const ICON_BUTTON_CLASS_NAME =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus)] disabled:cursor-default disabled:opacity-40 disabled:hover:text-[var(--muted)] motion-reduce:transition-none';

export function SortableColumnRow<T extends object>({
  row,
  position,
  options,
  invalid,
  removable,
  onFieldChange,
  onRemove,
}: SortableColumnRowProps<T>) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.key });

  const handleChange = (value: string | null) => {
    const option = options.find((candidate) => candidate.field === value);
    onFieldChange(option === undefined ? null : option.field);
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={twMerge(
        'flex items-start gap-2 rounded bg-[var(--surface)] py-1',
        isDragging && 'relative z-10 shadow-md',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={twMerge(ICON_BUTTON_CLASS_NAME, 'cursor-grab active:cursor-grabbing')}
        aria-label={t('table.settings.row.move', { position })}
        {...attributes}
        {...listeners}
      >
        <span className="pi pi-bars" aria-hidden="true" />
      </button>
      <Select
        className="min-w-0 flex-1"
        options={options.map((option) => ({ value: option.field, label: t(option.labelKey) }))}
        value={row.field}
        onChange={handleChange}
        sortOptions={false}
        errorMessage={invalid ? t('table.settings.row.empty') : undefined}
      />
      <button
        type="button"
        className={ICON_BUTTON_CLASS_NAME}
        aria-label={t('table.settings.row.remove', { position })}
        disabled={!removable}
        onClick={onRemove}
      >
        <span className="pi pi-times" aria-hidden="true" />
      </button>
    </li>
  );
}
