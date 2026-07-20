import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { NavigationPanel as IwaNavigationPanel } from 'iwa-react-components';
import { cx } from './cx';

export interface NavigationPanelProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  footer?: ReactNode;
}

/** Thin layout adapter around the IWA NavigationPanel component. */
export const NavigationPanel = forwardRef<HTMLDivElement, NavigationPanelProps>(
  function NavigationPanel({ title, footer, children, className, ...rest }, ref) {
    return (
      <div ref={ref} className={cx('h-full min-w-0', className)} {...rest}>
        <IwaNavigationPanel title={title} footer={footer}>
          {children}
        </IwaNavigationPanel>
      </div>
    );
  },
);
