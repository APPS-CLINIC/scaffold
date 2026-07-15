import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../cx';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconTone = 'outline' | 'neutral' | 'accent';

const baseClasses =
  'inline-flex shrink-0 select-none items-center justify-center overflow-hidden ' +
  'rounded-full align-middle [&_svg]:h-[55%] [&_svg]:w-[55%]';

const sizeClasses: Record<IconSize, string> = {
  sm: 'size-6',
  md: 'size-9',
  lg: 'size-12',
  xl: 'size-16',
};

const toneClasses: Record<IconTone, string> = {
  /** Light surface with a subtle ring — icon color inherits `currentColor`. */
  outline: 'border border-[var(--border)] bg-[var(--surface)]',
  neutral: 'bg-[var(--surface-muted)] text-[var(--muted)]',
  accent: 'bg-[var(--accent)] text-white',
};

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
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

/**
 * Circular icon container: a `rounded-full` badge with the glyph centered
 * inside. Pass any icon element (inline SVG, icon-font glyph, emoji) as
 * children; SVGs are auto-scaled to ~55% of the circle and pick up
 * `currentColor`, so tint via `text-*` utilities or the `tone` prop.
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  { size = 'md', tone = 'outline', label, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={cx(baseClasses, sizeClasses[size], toneClasses[tone], className)}
      {...rest}
    >
      {children}
    </span>
  );
});
