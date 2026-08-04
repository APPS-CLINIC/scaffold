import type { ReactNode } from 'react';

export function renderCellValue(value: unknown, notAvailable: ReactNode): ReactNode {
  if (value === null || value === undefined || value === '') return notAvailable;

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return notAvailable;
  }
}
