import {
  forwardRef,
  useMemo,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { cx } from '../cx';
import { Icon, type IconProps } from './Icon';

export type UseCustomIconOptions = Pick<IconProps, 'size' | 'tone' | 'label' | 'className'>;

export type CustomIconProps = Omit<IconProps, 'children'>;

export type CustomIconComponent = ForwardRefExoticComponent<
  CustomIconProps & RefAttributes<HTMLSpanElement>
>;

/**
 * Binds a glyph (plus default `Icon` options) into a ready-to-use component:
 *
 * ```tsx
 * const UserIcon = useCustomIcon(<UserSvg />, { size: 'lg', label: 'User' });
 * // ...
 * <UserIcon />                // defaults from the options above
 * <UserIcon tone="accent" />  // per-usage props override the defaults
 * ```
 *
 * The returned component is memoized on the icon element and options, so keep
 * them referentially stable (hoist the element or wrap it in `useMemo`) to
 * preserve component identity across re-renders.
 */
export function useCustomIcon(
  icon: ReactNode,
  options: UseCustomIconOptions = {},
): CustomIconComponent {
  const { size, tone, label, className } = options;

  return useMemo(() => {
    return forwardRef<HTMLSpanElement, CustomIconProps>(function CustomIcon(
      { className: usageClassName, ...props },
      ref,
    ) {
      return (
        <Icon
          ref={ref}
          size={size}
          tone={tone}
          label={label}
          className={cx(className, usageClassName)}
          {...props}
        >
          {icon}
        </Icon>
      );
    });
  }, [icon, size, tone, label, className]);
}
