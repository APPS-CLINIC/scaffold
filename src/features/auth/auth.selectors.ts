import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export const selectAuth = (state: RootState) => state.auth;

export const selectUser = (state: RootState) => state.auth.user;

export const selectIsAuthenticated = (state: RootState) => state.auth.status === 'authenticated';

export const selectUserRoles = createSelector([selectUser], (user) => user?.roles ?? []);

/** Factory selector: does the current user hold a given role? */
export const selectHasRole = (role: string) =>
  createSelector([selectUserRoles], (roles) => roles.includes(role));
