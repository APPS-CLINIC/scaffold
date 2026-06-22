import { describe, expect, it } from 'vitest';
import { authReducer } from './auth.slice';
import { authCleared, authResolved, authUnauthenticated, sessionExpired } from './auth.slice';
import type { AuthState, UserIdentity } from './auth.types';

const user: UserIdentity = {
  id: 'u1',
  displayName: 'Jan Kowalski',
  email: 'jan@example.com',
  roles: ['RM'],
};

const initial: AuthState = { status: 'unknown', user: null, token: null };

describe('auth slice', () => {
  it('starts in an unknown, signed-out state', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  it('resolves an identity (with optional token)', () => {
    const next = authReducer(initial, authResolved({ user, token: 'abc' }));
    expect(next.status).toBe('authenticated');
    expect(next.user).toEqual(user);
    expect(next.token).toBe('abc');
  });

  it('defaults the token to null when omitted', () => {
    const next = authReducer(initial, authResolved({ user }));
    expect(next.token).toBeNull();
  });

  it('marks the session unauthenticated', () => {
    const next = authReducer(initial, authUnauthenticated());
    expect(next.status).toBe('unauthenticated');
    expect(next.user).toBeNull();
  });

  it('expires the session and drops the token but keeps the user', () => {
    const authed = authReducer(initial, authResolved({ user, token: 'abc' }));
    const next = authReducer(authed, sessionExpired());
    expect(next.status).toBe('expired');
    expect(next.token).toBeNull();
    expect(next.user).toEqual(user);
  });

  it('clears back to the initial state', () => {
    const authed = authReducer(initial, authResolved({ user, token: 'abc' }));
    expect(authReducer(authed, authCleared())).toEqual(initial);
  });
});
