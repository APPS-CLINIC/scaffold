/** Lifecycle of the corporate session. */
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'expired';

/** Identity resolved from Azure Entra ID (via the gateway). */
export interface UserIdentity {
  id: string;
  displayName: string;
  email: string;
  /** Coarse-grained roles used to gate views/actions (e.g. team access). */
  roles: string[];
}

export interface AuthState {
  status: AuthStatus;
  user: UserIdentity | null;
  /**
   * Optional bearer token forwarded to the API gateway (OKAPI). May stay null
   * when the gateway injects identity headers server-side
   * (see docs/adr/0015-authentication-entra-id.md).
   */
  token: string | null;
}
