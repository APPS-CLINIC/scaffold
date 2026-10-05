import { useId } from 'react';
import { twMerge } from '@/ui';

interface DialogHeadingProps {
  text: string;
  centered?: boolean;
  /** Draws a line under the heading, edge to edge. */
  divided?: boolean;
}

/**
 * The dialog heading, drawn in the unpadded content in the band of the library's close
 * button. The library names the dialog only after its own heading, so the dialog element is
 * pointed at this one.
 */
export function DialogHeading({ text, centered = false, divided = false }: DialogHeadingProps) {
  const id = useId();

  return (
    <h2
      ref={(heading) => {
        heading?.closest('[role="dialog"]')?.setAttribute('aria-labelledby', id);
      }}
      id={id}
      className={twMerge(
        'm-0 shrink-0 text-2xl font-bold leading-8 text-[var(--text)]',
        centered ? 'px-14 text-center' : 'pl-6 pr-14',
        divided ? 'border-b border-[var(--border-subtle)] py-4' : 'pb-2 pt-4',
      )}
    >
      {text}
    </h2>
  );
}
