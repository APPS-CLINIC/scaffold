import { twMerge } from 'iwa-react-components';

export type StatusIndicatorTone = 'success' | 'inactive' | 'warning';

interface StatusIndicatorProps {
  label: string;
  tone: StatusIndicatorTone;
}

const statusIcon = {
  success: 'pi-check',
  inactive: 'pi-times',
  warning: 'pi-exclamation-triangle',
} as const satisfies Record<StatusIndicatorTone, string>;

function getIconClassName(tone: StatusIndicatorTone): string {
  if (tone === 'warning') return 'text-xs text-[var(--warning)]';

  return twMerge(
    'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] text-white',
    tone === 'success' ? 'bg-[var(--success)]' : 'bg-[var(--inactive)]',
  );
}

export function StatusIndicator({ label, tone }: StatusIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[var(--text)]">
      <span
        aria-hidden="true"
        className={twMerge('pi', statusIcon[tone], getIconClassName(tone))}
      />
      {label}
    </span>
  );
}
