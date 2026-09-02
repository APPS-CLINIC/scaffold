import {
  forwardRef,
  useMemo,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { twMerge } from 'iwa-react-components';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconTone = 'outline' | 'neutral' | 'accent' | 'brand';

const baseClasses =
  'inline-flex shrink-0 select-none items-center justify-center overflow-hidden ' +
  'rounded-full align-middle [&_svg]:h-[55%] [&_svg]:w-[55%]';

const sizeClasses: Record<IconSize, string> = {
  sm: 'size-6',
  md: 'size-9',
  lg: 'size-12',
  xl: 'size-16',
  '2xl': 'size-24',
};

const toneClasses: Record<IconTone, string> = {
  /** Light surface with a subtle ring — icon color inherits `currentColor`. */
  outline: 'border border-[var(--border)] bg-[var(--surface)]',
  neutral: 'bg-[var(--surface-muted)] text-[var(--muted)]',
  accent: 'bg-[var(--accent)] text-white',
  brand: 'bg-[var(--navigation-accent)] text-white',
};

export interface CustomIconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Diameter of the circle. */
  size?: IconSize;
  /** Visual style of the circle; colors come from the global design tokens. */
  tone?: IconTone;
  /**
   * Accessible name announced by screen readers. Omit for purely decorative
   * icons — the element is then hidden from assistive technology.
   */
  label?: string;
}

export type UseCustomIconOptions = Pick<CustomIconProps, 'size' | 'tone' | 'label' | 'className'>;

export type CustomIconComponent = ForwardRefExoticComponent<
  CustomIconProps & RefAttributes<HTMLSpanElement>
>;

/**
 * Binds a glyph into a ready-to-use circular icon component with default
 * styling built in: a `rounded-full` badge (Tailwind-only) with the glyph
 * centered inside. SVG glyphs are auto-scaled to ~55% of the circle and pick
 * up `currentColor`, so tint via `text-*` utilities or the `tone` prop.
 *
 * ```tsx
 * const userGlyph = <UserSvg />;
 *
 * function UserAvatar() {
 *   const UserIcon = useCustomIcon(userGlyph, { size: 'lg', label: 'User' });
 *   return <UserIcon tone="accent" />;
 * }
 * ```
 *
 * The returned component is memoized on the glyph element and options, so
 * keep them referentially stable (hoist the element or wrap it in `useMemo`)
 * to preserve component identity across re-renders.
 */
export function useCustomIcon(
  icon: ReactNode,
  options: UseCustomIconOptions = {},
): CustomIconComponent {
  const {
    size: defaultSize = 'md',
    tone: defaultTone = 'outline',
    label: defaultLabel,
    className: defaultClassName,
  } = options;

  return useMemo(() => {
    return forwardRef<HTMLSpanElement, CustomIconProps>(function CustomIcon(
      { size = defaultSize, tone = defaultTone, label = defaultLabel, className, ...rest },
      ref,
    ) {
      return (
        <span
          ref={ref}
          {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
          className={twMerge(
            baseClasses,
            sizeClasses[size],
            toneClasses[tone],
            defaultClassName,
            className,
          )}
          {...rest}
        >
          {icon}
        </span>
      );
    });
  }, [icon, defaultSize, defaultTone, defaultLabel, defaultClassName]);
}
