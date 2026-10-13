import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';
import { MemoryRouter } from 'react-router-dom';
import { makeStore, type AppStore, type RootState } from '@/app/store';
import { createUrlState } from '@/features/urlState/urlState.slice';
import '@/i18n';
// Straight from its module: some tests mock the `@/ui` barrel.
import { ToastProvider } from '@/ui/toast/ToastProvider';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  /** Initial URL entries for the in-memory router. */
  initialEntries?: string[];
  /** Entry rendered first; defaults to MemoryRouter's last-entry behavior. */
  initialIndex?: number;
}

/**
 * Renders a component with the full app context (Redux store + router + the
 * toast host every routed view sits in) so feature components and URL-driven
 * hooks can be tested in isolation.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store: providedStore,
    initialEntries = ['/'],
    initialIndex,
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  const routerEntries = initialEntries.length > 0 ? initialEntries : ['/'];
  const lastEntryIndex = routerEntries.length - 1;
  const routerInitialIndex = Math.min(Math.max(initialIndex ?? lastEntryIndex, 0), lastEntryIndex);
  const initialEntry = routerEntries[routerInitialIndex] ?? '/';
  const initialUrl = new URL(initialEntry, 'https://app.test');
  const store =
    providedStore ??
    makeStore({
      ...preloadedState,
      urlState: preloadedState?.urlState ?? createUrlState(initialUrl.pathname, initialUrl.search),
    });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <PrimeReactProvider>
        <Provider store={store}>
          <MemoryRouter initialEntries={routerEntries} initialIndex={routerInitialIndex}>
            <ToastProvider>{children}</ToastProvider>
          </MemoryRouter>
        </Provider>
      </PrimeReactProvider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
