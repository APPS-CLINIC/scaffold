import type { AppDispatch } from '@/app/store';
import { authResolved, authUnauthenticated } from './auth.slice';
import type { UserIdentity } from './auth.types';

/**
 * The gateway (OKAPI) is expected to inject the Entra ID identity into the page
 * — here we read it from a global it sets. This is the single seam to adapt
 * when the real SSO/header flow is finalized (see the Entra ID spike and
 * docs/adr/0015-authentication-entra-id.md).
 */
interface IdentityWindow {
  __BIX_IDENTITY__?: UserIdentity;
}

export function readInjectedIdentity(): UserIdentity | null {
  if (typeof window === 'undefined') return null;
  return (window as IdentityWindow).__BIX_IDENTITY__ ?? null;
}

/**
 * Resolve identity once at startup. If absent, mark the session
 * unauthenticated — the app can then redirect to SSO. Kept side-effect-light
 * so it is trivial to call from `main.tsx` and to test.
 */
export function bootstrapAuth(dispatch: AppDispatch): void {
  const identity = readInjectedIdentity();
  if (identity) {
    dispatch(authResolved({ user: identity }));
  } else {
    dispatch(authUnauthenticated());
  }
}
