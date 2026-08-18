import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './ui.module.css';
import { cx } from './cx';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cx(styles.control, className)} {...rest}>
      {children}
    </select>
  );
});
