import { forwardRef, type ComponentType, type HTMLAttributes } from 'react';
import { cx } from './cx';

export type NavigationIconComponent = ComponentType<{ className?: string }>;

export interface NavigationIconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: NavigationIconComponent;
}

/** Applies consistent navigation sizing and color to any configured IWA icon. */
export const NavigationIcon = forwardRef<HTMLSpanElement, NavigationIconProps>(
  function NavigationIcon({ icon: Icon, className, ...rest }, ref) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cx(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center text-[var(--navigation-accent)]',
          className,
        )}
        {...rest}
      >
        <Icon className="h-5 w-5" />
      </span>
    );
  },
);
