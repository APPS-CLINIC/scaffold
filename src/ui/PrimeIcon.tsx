import { forwardRef, type HTMLAttributes } from 'react';
import { twMerge } from 'iwa-react-components';

export type PrimeIconName =
  | 'box'
  | 'briefcase'
  | 'building'
  | 'calendar'
  | 'chart-line'
  | 'chevron-down'
  | 'chevron-right'
  | 'credit-card'
  | 'database'
  | 'eye'
  | 'home'
  | 'id-card'
  | 'shield'
  | 'user'
  | 'users';

export interface PrimeIconProps extends HTMLAttributes<HTMLSpanElement> {
  name: PrimeIconName;
}

/** Token-sized adapter for the PrimeIcons font already shipped by IWA's stack. */
export const PrimeIcon = forwardRef<HTMLSpanElement, PrimeIconProps>(function PrimeIcon(
  { name, className, 'aria-label': ariaLabel, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : { 'aria-hidden': true })}
      className={twMerge(
        `pi pi-${name}`,
        'inline-flex items-center justify-center text-xl leading-none',
        className,
      )}
      {...rest}
    />
  );
});
