import type { ComponentProps, ComponentPropsWithRef, ReactNode } from 'react';
import type { InlineLinkProps, StatusProps } from 'iwa-react-components';
import { DataTable } from 'primereact/datatable';

/**
 * Stand-in for `iwa-react-components` in tests that render IWA-backed UI.
 *
 * Mock the library, never the `@/ui` barrel: a `vi.mock` factory replaces the whole
 * module, and the barrel also exports this repo's own primitives, so faking it deletes
 * `createPrimeIcon`, `PrimeIcon`, `cx` and the adapters. Anything in the graph that
 * reaches one then fails with `No "<name>" export is defined on the "@/ui" mock`.
 *
 * Use it as:
 *
 * ```ts
 * vi.mock('iwa-react-components', () => import('@/test/iwaComponentsMock'));
 * ```
 *
 * Add an export here when a test needs a name this file does not cover yet; a missing
 * one surfaces as `(0, <name>) is not a function` at render time.
 */

/**
 * Callers override component defaults through `twMerge`, so a plain join would let a
 * default win and quietly change what the components under test render. This resolves
 * the conflict groups this repo actually relies on; widen it when a component starts
 * depending on another group.
 */
const CONFLICT_GROUPS: ReadonlyArray<readonly [string, RegExp]> = [
  ['min-width', /^min-w-/],
  ['overflow-x', /^overflow-x-/],
  ['overflow-y', /^overflow-y-/],
  ['overflow', /^overflow-/],
  ['font-size', /^text-(xs|sm|base|lg|xl|[2-9]xl)$/],
];

const groupOf = (token: string) => CONFLICT_GROUPS.find(([, pattern]) => pattern.test(token))?.[0];

export function twMerge(...classLists: Array<string | false | null | undefined>): string {
  const tokens = classLists
    .filter((value): value is string => Boolean(value))
    .flatMap((classList) => classList.trim().split(/\s+/u));
  const merged: string[] = [];

  for (const token of tokens) {
    const group = groupOf(token);
    if (group) {
      const conflicting = merged.findIndex((candidate) => groupOf(candidate) === group);
      if (conflicting >= 0) merged.splice(conflicting, 1);
    }
    merged.push(token);
  }

  return merged.join(' ');
}

/**
 * The IWA Table is a styled PrimeReact DataTable and PaginatorTable is that table with
 * the paginator switched on, so delegating keeps the rendered markup — including the
 * `p-datatable-*` hooks — identical to production without loading the IWA package.
 */
export function Table({
  dataTableRef,
  separatedRows: _separatedRows,
  ...props
}: ComponentProps<typeof DataTable> & {
  dataTableRef?: ComponentPropsWithRef<typeof DataTable>['ref'];
  separatedRows?: boolean;
}) {
  return <DataTable {...props} ref={dataTableRef ?? undefined} />;
}

export function PaginatorTable(props: ComponentProps<typeof Table>) {
  return <Table paginator {...props} />;
}

// Typed with the library's own prop types, so a prop-contract drift breaks `tsc -b`
// instead of silently passing.
export function Status({ type, label }: StatusProps) {
  return (
    <span data-testid="status" data-type={type}>
      {label}
    </span>
  );
}

export function InlineLink({ label, url, openInNewTab }: InlineLinkProps) {
  return (
    <a data-testid="inline-link" href={url} data-new-tab={openInNewTab ? 'true' : undefined}>
      {label as ReactNode}
    </a>
  );
}
