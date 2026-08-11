import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GenericDataTableField, GenericDataTableFieldConfig } from './GenericDataTable.types';

/** Width reserved for the row-expansion toggle column (matches `min-w-11`). */
export const EXPANDER_COLUMN_WIDTH_PX = 44;

/**
 * Resolve the display order: fields listed in `columnOrder` first (in that
 * order), the remaining fields after them in their `fields` order.
 */
export function orderFields<T extends object>(
  fields: readonly GenericDataTableFieldConfig<T>[],
  columnOrder?: readonly GenericDataTableField<T>[],
): readonly GenericDataTableFieldConfig<T>[] {
  if (!columnOrder || columnOrder.length === 0) return fields;

  const rankByField = new Map(columnOrder.map((field, index) => [field as string, index]));
  const listed = fields
    .filter((field) => rankByField.has(field.field))
    .sort(
      (left, right) => (rankByField.get(left.field) ?? 0) - (rankByField.get(right.field) ?? 0),
    );
  const unlisted = fields.filter((field) => !rankByField.has(field.field));

  return [...listed, ...unlisted];
}

export interface ResponsiveFieldSplit<T extends object> {
  visibleFields: readonly GenericDataTableFieldConfig<T>[];
  accordionFields: readonly GenericDataTableFieldConfig<T>[];
}

/**
 * Decide which fields fit as columns without horizontal scrolling. Fields
 * drop to the accordion from the end of the display order: the first field
 * that does not fit takes every later optional field with it, so column
 * order is always preserved. `alwaysVisible` fields never drop.
 */
export function splitFieldsByWidth<T extends object>(
  orderedFields: readonly GenericDataTableFieldConfig<T>[],
  containerWidth: number | null,
): ResponsiveFieldSplit<T> {
  if (orderedFields.length === 0) return { visibleFields: [], accordionFields: [] };

  const pinnedFields = orderedFields.filter((field) => field.alwaysVisible);

  if (containerWidth === null || containerWidth <= 0) {
    // Not measured yet (first paint, hidden container, jsdom): render only the
    // pinned minimum so the layout effect can settle on the real split before
    // anything meaningful is painted.
    const visibleFields = pinnedFields.length > 0 ? pinnedFields : orderedFields.slice(0, 1);
    return {
      visibleFields,
      accordionFields: orderedFields.filter((field) => !visibleFields.includes(field)),
    };
  }

  const totalWidth = orderedFields.reduce((sum, field) => sum + field.width, 0);
  if (totalWidth <= containerWidth) {
    return { visibleFields: orderedFields, accordionFields: [] };
  }

  let budget = containerWidth - EXPANDER_COLUMN_WIDTH_PX;
  for (const field of pinnedFields) budget -= field.width;

  const visibleFields: GenericDataTableFieldConfig<T>[] = [];
  const accordionFields: GenericDataTableFieldConfig<T>[] = [];
  let dropped = false;

  for (const field of orderedFields) {
    if (field.alwaysVisible) {
      visibleFields.push(field);
      continue;
    }
    if (!dropped && field.width <= budget) {
      visibleFields.push(field);
      budget -= field.width;
    } else {
      dropped = true;
      accordionFields.push(field);
    }
  }

  if (visibleFields.length === 0) {
    // Pathologically narrow container: always keep the first field as a column.
    return {
      visibleFields: accordionFields.slice(0, 1),
      accordionFields: accordionFields.slice(1),
    };
  }

  return { visibleFields, accordionFields };
}

interface UseResponsiveFieldsOptions<T extends object> {
  fields: readonly GenericDataTableFieldConfig<T>[];
  columnOrder?: readonly GenericDataTableField<T>[];
}

/**
 * Measure the table container and split the configured fields into visible
 * columns and accordion overflow. Measurement happens in a layout effect, so
 * the pre-measure minimal render is replaced before the browser paints.
 */
export function useResponsiveFields<T extends object>({
  fields,
  columnOrder,
}: UseResponsiveFieldsOptions<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const measure = () => setContainerWidth(element.getBoundingClientRect().width);
    measure();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const orderedFields = useMemo(() => orderFields(fields, columnOrder), [fields, columnOrder]);
  const { visibleFields, accordionFields } = useMemo(
    () => splitFieldsByWidth(orderedFields, containerWidth),
    [orderedFields, containerWidth],
  );

  return { containerRef, containerWidth, visibleFields, accordionFields };
}
