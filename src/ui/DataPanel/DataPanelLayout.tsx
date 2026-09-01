import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { twMerge } from 'iwa-react-components';

interface DataPanelLayoutProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  header?: ReactNode;
  firstColumn: ReactNode;
  secondColumn: ReactNode;
}

/** Shared geometry for the loaded panel and its skeleton. */
export const DataPanelLayout = forwardRef<HTMLDivElement, DataPanelLayoutProps>(
  function DataPanelLayout({ icon, header, firstColumn, secondColumn, className, ...rest }, ref) {
    const hasIcon = Boolean(icon);

    return (
      <div
        ref={ref}
        className={twMerge(
          'grid min-w-0 grid-cols-1 items-start gap-4 lg:gap-x-8 lg:gap-y-4',
          hasIcon ? 'lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]' : 'lg:grid-cols-2',
          className,
        )}
        {...rest}
      >
        {hasIcon ? (
          <div className="flex shrink-0 items-start justify-start lg:row-span-2 lg:justify-center">
            {icon}
          </div>
        ) : null}
        {header ? <div className="min-w-0 lg:col-span-2">{header}</div> : null}
        {firstColumn}
        {secondColumn}
      </div>
    );
  },
);

interface DataPanelColumnLayoutProps {
  title?: ReactNode;
  children: ReactNode;
}

/** Keeps loaded and loading columns on the same vertical rhythm. */
export function DataPanelColumnLayout({ title, children }: DataPanelColumnLayoutProps) {
  return (
    <section className="min-w-0">
      {title ? (
        <h3 className="mb-2 mt-0 text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
      ) : null}
      <div className="min-w-0 space-y-2">{children}</div>
    </section>
  );
}

interface DataPanelDefinitionProps {
  children: ReactNode;
}

/** Responsive overrides around IWA DefinitionList's fixed desktop label width. */
export function DataPanelDefinition({ children }: DataPanelDefinitionProps) {
  return (
    <div
      className={twMerge(
        'min-w-0',
        '[&>dl]:grid [&>dl]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] [&>dl]:items-start [&>dl]:gap-3',
        '[&_dt]:w-auto [&_dt]:min-w-0 [&_dt]:shrink [&_dt]:text-left',
        '[&_dt>div]:break-words [&_dt>div]:text-[var(--muted)]',
        '[&_dd]:min-w-0 [&_dd>div]:break-words [&_dd>div]:text-[var(--text)]',
      )}
    >
      {children}
    </div>
  );
}
