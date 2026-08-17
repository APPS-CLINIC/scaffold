import { cloneElement, createElement, type ReactElement } from 'react';
import { twMerge } from '@/ui';
import type { DataTablePassThroughOptions } from 'primereact/datatable';
import type { PaginatorTemplate } from 'primereact/paginator';
import type {
  GenericDataTablePageChange,
  GenericDataTablePaginatorActionLabels,
  GenericDataTableSortChange,
} from './GenericDataTable.types';

export interface PrimeColumnBodyOptions {
  rowIndex: number;
}

export interface PrimePageEvent {
  first: number;
  rows: number;
}

export interface PrimeSortEvent {
  sortField: string;
  sortOrder: 1 | 0 | -1 | null | undefined;
}

export type PrimeDataTableRow = Record<string, unknown>;

type PaginatorTemplateConfig = Exclude<PaginatorTemplate, string | undefined>;

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const DATA_TABLE_CLASS_NAME =
  'w-full max-w-full overflow-hidden bg-[var(--surface)] [&_.p-datatable-row-expansion>td]:!p-0 [&_.p-datatable-thead>tr>th]:!bg-[var(--surface)] [&_.p-datatable-thead>tr>th]:!px-2 [&_.p-datatable-thead>tr>th]:!py-2 [&_.p-datatable-tbody>tr>td]:!px-2 [&_.p-datatable-tbody>tr>td]:!py-1.5 [&_.p-dropdown]:!h-8 [&_.p-sortable-column-icon]:!h-3 [&_.p-sortable-column-icon]:!w-3 sm:[&_.p-paginator-next]:!h-8 sm:[&_.p-paginator-next]:!min-w-8 sm:[&_.p-paginator-page]:!h-8 sm:[&_.p-paginator-page]:!min-w-8 sm:[&_.p-paginator-prev]:!h-8 sm:[&_.p-paginator-prev]:!min-w-8';

function withAriaLabel(element: ReactElement, label: string | undefined): ReactElement {
  if (!label) return element;

  return cloneElement(element as ReactElement<Record<string, unknown>>, {
    'aria-label': label,
  });
}

export function createPaginatorTemplate(
  labels: GenericDataTablePaginatorActionLabels | undefined,
): PaginatorTemplateConfig | undefined {
  if (!labels) return undefined;

  return {
    layout:
      'RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
    RowsPerPageDropdown: (options) =>
      createElement(
        'span',
        {
          className:
            'mr-auto inline-flex items-center gap-2 whitespace-nowrap text-xs text-[var(--muted)]',
        },
        createElement('span', null, labels.rowsPerPage),
        options.element,
      ),
    CurrentPageReport: (options) =>
      createElement(
        'span',
        { className: 'whitespace-nowrap px-2 text-xs text-[var(--muted)]' },
        labels.currentPageReport?.(options.first, options.last, options.totalRecords),
      ),
    FirstPageLink: (options) => withAriaLabel(options.element, labels.firstPage),
    PrevPageLink: (options) => withAriaLabel(options.element, labels.previousPage),
    PageLinks: (options) => withAriaLabel(options.element, labels.page?.(options.page + 1)),
    NextPageLink: (options) => withAriaLabel(options.element, labels.nextPage),
    LastPageLink: (options) => withAriaLabel(options.element, labels.lastPage),
  };
}

export function mapPageEvent(event: PrimePageEvent): GenericDataTablePageChange {
  const pageSize = Math.max(1, event.rows);
  return {
    page: Math.floor(Math.max(0, event.first) / pageSize) + 1,
    pageSize,
  };
}

export function mapSortEvent(event: PrimeSortEvent): GenericDataTableSortChange | undefined {
  if (event.sortOrder !== 1 && event.sortOrder !== -1) return undefined;

  return {
    field: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  };
}

export function createDataTablePassThrough(
  tableLabel: string,
  paginationLabel: string,
  rowsPerPageLabel: string | undefined,
  loading: boolean,
): DataTablePassThroughOptions {
  return {
    wrapper: {
      className: 'touch-pan-x overflow-x-auto overscroll-x-contain [container-type:inline-size]',
    },
    table: {
      'aria-label': tableLabel,
      'aria-busy': loading,
    },
    bodyRow: {
      className: 'transition-colors hover:bg-[var(--surface-muted)] motion-reduce:transition-none',
    },
    paginator: {
      root: {
        role: 'navigation',
        'aria-label': paginationLabel,
        className: 'flex-wrap gap-0.5 px-2 py-1.5',
      },
      firstPageButton: {
        className: 'min-h-11 min-w-11 rounded-full sm:min-h-8 sm:min-w-8',
      },
      prevPageButton: {
        className: 'min-h-11 min-w-11 rounded-full sm:min-h-8 sm:min-w-8',
      },
      pageButton: (options) => ({
        className: twMerge(
          'min-h-11 min-w-11 rounded-full text-xs sm:min-h-8 sm:min-w-8',
          options?.context.active && '!bg-[var(--accent)] !text-white',
        ),
      }),
      nextPageButton: {
        className: 'min-h-11 min-w-11 rounded-full sm:min-h-8 sm:min-w-8',
      },
      lastPageButton: {
        className: 'min-h-11 min-w-11 rounded-full sm:min-h-8 sm:min-w-8',
      },
      RPPDropdown: {
        root: {
          className: 'h-8 min-w-16 rounded-sm !border !border-[var(--border)] !bg-[var(--surface)]',
        },
        input: {
          'aria-label': rowsPerPageLabel,
          className: 'py-1 text-xs',
        },
      },
    },
    column: {
      headerCell: {
        className:
          'whitespace-normal border-b border-[var(--navigation-accent)] bg-[var(--surface)] px-2 py-2 text-left text-sm font-bold leading-5 text-[var(--text)]',
      },
      headerContent: { className: 'min-h-8 justify-start gap-1' },
      bodyCell: {
        className: 'border-b border-[var(--border-subtle)] px-2 py-2 align-middle text-sm',
      },
    },
  };
}
