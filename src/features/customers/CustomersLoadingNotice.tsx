import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { LoadingSpinner } from '@/ui';
import type { ListLoadCause } from '@/features/urlState/listLoadCause';

const CANCEL_LABELS: Record<ListLoadCause, MessageKey> = {
  first: 'customers.loading.retry',
  search: 'customers.loading.cancelSearch',
  filters: 'customers.loading.cancelFilters',
  other: 'customers.loading.cancel',
};

interface CustomersLoadingNoticeProps {
  cause: ListLoadCause;
  /** The load has taken long enough to say so. */
  slow: boolean;
  onCancel: () => void;
}

/** The toast while the customer list loads: what happens, and a way to call it off. */
export function CustomersLoadingNotice({ cause, slow, onCancel }: CustomersLoadingNoticeProps) {
  const { t } = useTranslation();

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <LoadingSpinner size="16" />
      <span>{t(slow ? 'customers.loading.slow' : 'customers.loading.fetching')}</span>
      {/* The library's snackbar link only opens a URL, so the action is a plain button. */}
      <button
        type="button"
        className="cursor-pointer rounded-sm border-0 bg-transparent p-0 text-inherit underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        onClick={onCancel}
      >
        {t(CANCEL_LABELS[cause])}
      </button>
    </span>
  );
}
