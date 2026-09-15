import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconButton, Select, twMerge } from 'iwa-react-components';
import { useTranslation } from 'react-i18next';
import type { GenericDataTableField, TableColumnOption } from '../GenericDataTable.types';
import type { ColumnDraftRow } from './columnSettingsDraft';

export interface SortableColumnRowProps<T extends object> {
  row: ColumnDraftRow<GenericDataTableField<T>>;
  /** 1-based, for the accessible names of the row controls. */
  position: number;
  /** Fields this row may pick, in configuration order; it includes the row's own field. */
  options: readonly TableColumnOption<T>[];
  removable: boolean;
  onFieldChange: (field: GenericDataTableField<T> | null) => void;
  onRemove: () => void;
}

const DRAG_HANDLE_CLASS_NAME =
  'inline-flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded text-[var(--muted)] transition-colors hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus)] active:cursor-grabbing motion-reduce:transition-none';

/**
 * One column of the settings list. A column already in use shows its name; only a
 * row added in this session picks its field from a Select.
 */
export function SortableColumnRow<T extends object>({
  row,
  position,
  options,
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

  const current = options.find((option) => option.field === row.field);

  // IWA's Select passes PrimeReact's change event, so the picked option's value is `event.value`.
  const handleChange = (event: { value: unknown }) => {
    const option = options.find((candidate) => candidate.field === event.value);
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
        className={DRAG_HANDLE_CLASS_NAME}
        aria-label={t('table.settings.row.move', { position })}
        {...attributes}
        {...listeners}
      >
        <span className="pi pi-bars" aria-hidden="true" />
      </button>
      {row.added ? (
        <Select
          className="min-w-0 flex-1"
          options={options.map((option) => ({ value: option.field, label: t(option.labelKey) }))}
          value={row.field}
          onChange={handleChange}
          sortOptions={false}
          errorMessage={row.invalid ? t('table.settings.row.empty') : undefined}
        />
      ) : (
        <span className="flex min-h-10 min-w-0 flex-1 items-center break-words rounded border border-[#c4c9ce] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
          {current === undefined ? null : t(current.labelKey)}
        </span>
      )}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
        <IconButton
          size={20}
          disabled={!removable}
          onClick={onRemove}
          icon={
            // IWA's IconButton takes no aria-label, so the icon names the control.
            <svg
              viewBox="0 0 20 20"
              fill="none"
              role="img"
              aria-label={t('table.settings.row.remove', { position })}
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          }
        />
      </span>
    </li>
  );
}
