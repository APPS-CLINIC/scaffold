import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { NavigationPanel as IwaNavigationPanel, twMerge } from 'iwa-react-components';

export interface NavigationPanelProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
}

/** Thin layout adapter around the IWA NavigationPanel component. */
export const NavigationPanel = forwardRef<HTMLDivElement, NavigationPanelProps>(
  function NavigationPanel({ title, headerAction, footer, children, className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={twMerge(
          'relative h-full min-h-0 min-w-0 [&>section]:flex [&>section]:h-full [&>section]:min-h-0 [&>section]:flex-col',
          '[&>section>h2]:m-0 [&>section>h2]:flex [&>section>h2]:min-h-11 [&>section>h2]:shrink-0 [&>section>h2]:items-center [&>section>h2]:truncate [&>section>h2]:pl-16',
          className,
        )}
        {...rest}
      >
        <IwaNavigationPanel title={title} footer={footer}>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </IwaNavigationPanel>
        {headerAction ? (
          <div className="absolute left-0 top-0 z-10 w-16 overflow-hidden">{headerAction}</div>
        ) : null}
      </div>
    );
  },
);
