import { useEffect, useId, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, Dialog, Select } from '@/ui';
import type { GenericDataTableFilterOption } from '../GenericDataTable';
import type { FilterableField } from './filterableFields';
import type {
  TableFilterBarLabels,
  TableFilterDateRange,
  TableFilterValue,
  TableFilterValues,
} from './TableFilterBar.types';

interface FilterDialogProps<T extends object> {
  fields: readonly FilterableField<T>[];
  values: TableFilterValues;
  visibility: boolean;
  onSetVisibility: Dispatch<SetStateAction<boolean>>;
  onApply: (values: TableFilterValues) => void;
  labels: TableFilterBarLabels;
}

function toIsoDate(date: Date | null): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function asRange(value: TableFilterValue | undefined): TableFilterDateRange {
  return typeof value === 'object' && value !== null ? value : {};
}

/** Drop empty selections and empty ranges so "no filter" has one shape. */
function pruneDraft(draft: Readonly<Record<string, TableFilterValue>>): TableFilterValues {
  const next: Record<string, TableFilterValue> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (typeof value === 'string') {
      if (value) next[key] = value;
    } else if (value.from || value.to) {
      next[key] = value;
    }
  }
  return next;
}

/**
 * The "Dostosowujesz filtry" modal: one labeled row per filterable field —
 * a select or a from–to date pair — with sticky heading and footer buttons
 * (the middle section scrolls). Save applies the whole draft at once.
 */
export function FilterDialog<T extends object>({
  fields,
  values,
  visibility,
  onSetVisibility,
  onApply,
  labels,
}: FilterDialogProps<T>) {
  const { t } = useTranslation();
  const formId = useId();
  const [draft, setDraft] = useState<Record<string, TableFilterValue>>({ ...values });

  // Re-arm the draft each time the dialog opens with the applied state.
  useEffect(() => {
    if (visibility) setDraft({ ...values });
  }, [values, visibility]);

  const optionLabel = (option: GenericDataTableFilterOption) =>
    option.labelKey ? t(option.labelKey) : option.value;

  return (
    <Dialog
      headingProps={{ text: labels.dialogTitle }}
      visibility={visibility}
      onSetVisibility={onSetVisibility}
      buttonProps={[
        { label: labels.cancel, style: 'text', onClick: () => onSetVisibility(false) },
        {
          label: labels.save,
          style: 'filled',
          onClick: () => {
            onApply(pruneDraft(draft));
            onSetVisibility(false);
          },
        },
      ]}
    >
      <div className="flex flex-col gap-4">
        {fields.map((field) => {
          const key = String(field.field);
          const rowLabelId = `${formId}-${key}`;
          const draftValue = draft[key];

          return (
            <div
              key={key}
              className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(10rem,auto)_minmax(0,1fr)] sm:gap-4"
            >
              <span id={rowLabelId} className="text-sm text-[var(--text)] sm:text-right">
                {t(field.labelKey)}
              </span>
              {field.filter.type === 'select' ? (
                <Select
                  aria-label={t(field.labelKey)}
                  className="w-full max-w-72"
                  placeholder={labels.selectPlaceholder}
                  options={field.filter.options.map((option) => ({
                    value: option.value,
                    label: optionLabel(option),
                  }))}
                  value={typeof draftValue === 'string' ? draftValue : ''}
                  onChange={(value) => setDraft((current) => ({ ...current, [key]: value ?? '' }))}
                />
              ) : (
                <span className="flex items-center gap-2">
                  <DatePicker
                    aria-label={`${t(field.labelKey)} – ${t('common.dateRange.from')}`}
                    className="w-40"
                    value={asRange(draftValue).from ?? null}
                    onChange={(date) =>
                      setDraft((current) => ({
                        ...current,
                        [key]: { ...asRange(current[key]), from: toIsoDate(date) },
                      }))
                    }
                  />
                  <span aria-hidden="true" className="text-sm text-[var(--muted)]">
                    –
                  </span>
                  <DatePicker
                    aria-label={`${t(field.labelKey)} – ${t('common.dateRange.to')}`}
                    className="w-40"
                    value={asRange(draftValue).to ?? null}
                    onChange={(date) =>
                      setDraft((current) => ({
                        ...current,
                        [key]: { ...asRange(current[key]), to: toIsoDate(date) },
                      }))
                    }
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
