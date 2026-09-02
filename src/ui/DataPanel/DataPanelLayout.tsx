import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { twMerge } from 'iwa-react-components';

interface DataPanelLayoutProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  header?: ReactNode;
  summary?: ReactNode;
  firstColumn: ReactNode;
  secondColumn: ReactNode;
}

/** Shared geometry for the loaded panel and its skeleton. */
export const DataPanelLayout = forwardRef<HTMLDivElement, DataPanelLayoutProps>(
  function DataPanelLayout(
    { icon, header, summary, firstColumn, secondColumn, className, ...rest },
    ref,
  ) {
    const hasIcon = Boolean(icon);

    return (
      <div
        ref={ref}
        className={twMerge(
          'grid min-w-0 grid-cols-1 items-start gap-4',
          hasIcon
            ? 'md:grid-cols-[auto_minmax(0,1fr)] md:gap-y-0 lg:grid-cols-4 lg:gap-x-0'
            : 'md:grid-cols-1',
          className,
        )}
        {...rest}
      >
        {hasIcon ? (
          <div className="flex shrink-0 items-start justify-start md:self-stretch md:justify-center">
            {icon}
          </div>
        ) : null}
        <div className={twMerge('min-w-0 space-y-4', hasIcon && 'md:col-start-2 lg:col-span-3')}>
          {header ? <div className="min-w-0">{header}</div> : null}
          {summary ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-8">
              <div className="min-w-0">{summary}</div>
            </div>
          ) : null}
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-x-4 lg:gap-x-8">
            <div className="min-w-0">{firstColumn}</div>
            <div className="min-w-0">{secondColumn}</div>
          </div>
        </div>
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
  if (!title) return <div className="min-w-0 space-y-1">{children}</div>;

  return (
    <section className="min-w-0">
      <h3 className="mb-2 mt-0 text-xl font-bold text-[var(--text)]">{title}</h3>
      <div className="min-w-0 space-y-1">{children}</div>
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
        '[&>dl]:grid [&>dl]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] [&>dl]:items-start [&>dl]:gap-1',
        'md:[&>dl]:grid-cols-[max-content_minmax(0,1fr)]',
        '[&_dt]:w-auto [&_dt]:min-w-0 [&_dt]:shrink [&_dt]:text-left',
        '[&_dt>div]:break-words [&_dt>div]:font-bold [&_dt>div]:text-[var(--text)]',
        '[&_dd]:min-w-0 [&_dd>div]:break-words [&_dd>div]:text-[var(--text)]',
      )}
    >
      {children}
    </div>
  );
}
