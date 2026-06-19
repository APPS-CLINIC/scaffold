import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './ui.module.css';
import { cx } from './cx';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, type = 'text', ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cx(styles.control, className)} {...rest} />;
});
