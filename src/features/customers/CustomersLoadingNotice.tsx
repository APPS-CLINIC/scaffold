import { useTranslation } from 'react-i18next';
import type { ListLoadCause } from '@/features/urlState/listLoadCause';
import type { MessageKey } from '@/i18n/messages/pl';
import { LoadingSpinner, type LoadingPhase } from '@/ui';

/** Where the load stands: on its way, taking long, or failed. */
export type CustomersLoadState = Exclude<LoadingPhase, 'idle'> | 'failed';

const MESSAGES: Record<CustomersLoadState, MessageKey> = {
  loading: 'customers.loading.fetching',
  slow: 'customers.loading.slow',
  failed: 'customers.loading.failed',
};

const CANCEL_LABELS: Record<ListLoadCause, MessageKey> = {
  first: 'customers.loading.retry',
  search: 'customers.loading.cancelSearch',
  filters: 'customers.loading.cancelFilters',
  other: 'customers.loading.cancel',
};

interface CustomersLoadingNoticeProps {
  state: CustomersLoadState;
  cause: ListLoadCause;
  onCancel: () => void;
  onRetry: () => void;
}

/**
 * The toast while the customer list loads: what happens, and a way to call it off. When the
 * load fails, it says so and offers to try again.
 */
export function CustomersLoadingNotice({
  state,
  cause,
  onCancel,
  onRetry,
}: CustomersLoadingNoticeProps) {
  const { t } = useTranslation();
  const failed = state === 'failed';

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {failed ? null : <LoadingSpinner size="16" />}
      <span>{t(MESSAGES[state])}</span>
      {/* The library's snackbar link only opens a URL, so the action is a plain button. */}
      <button
        type="button"
        className="cursor-pointer rounded-sm border-0 bg-transparent p-0 text-inherit underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        onClick={failed ? onRetry : onCancel}
      >
        {t(failed ? 'customers.loading.tryAgain' : CANCEL_LABELS[cause])}
      </button>
    </span>
  );
}
