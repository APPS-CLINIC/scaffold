import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

/** RTL drains its async wrapper through a Jest-compatible timer hook, even under Vitest. */
export function userWithFakeTimers() {
  vi.useFakeTimers();
  vi.stubGlobal('jest', { advanceTimersByTime: vi.advanceTimersByTime });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}
