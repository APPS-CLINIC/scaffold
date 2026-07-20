import { forwardRef, type HTMLAttributes } from 'react';
import { Hide, Settings } from 'ing-react-icons';
import { cx } from './cx';

export type NavigationIconName = 'default' | 'collapse' | 'expand';

export interface NavigationIconProps extends HTMLAttributes<HTMLSpanElement> {
  name: NavigationIconName;
}

/**
 * Central IWA icon registry for navigation configuration. Replace mappings
 * here as the private icon catalog becomes available; menu declarations stay
 * unchanged.
 */
export const NavigationIcon = forwardRef<HTMLSpanElement, NavigationIconProps>(
  function NavigationIcon({ name, className, ...rest }, ref) {
    const Icon = name === 'default' ? Settings : Hide;
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cx(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center text-[var(--navigation-accent)]',
          name === 'expand' && 'rotate-180',
          className,
        )}
        {...rest}
      >
        <Icon className="h-5 w-5" />
      </span>
    );
  },
);
