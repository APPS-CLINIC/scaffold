import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';
import { cx } from './cx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

/**
 * Placeholder button. Swap the implementation for your org's component;
 * keep this props contract so callers stay untouched.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(styles.control, styles.button, styles[variant], className)}
      {...rest}
    />
  );
});
