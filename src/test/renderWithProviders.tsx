import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore, type AppStore, type RootState } from '@/app/store';
import { I18nProvider } from '@/i18n';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  /** Initial URL entries for the in-memory router. */
  initialEntries?: string[];
}

/**
 * Renders a component with the full app context (Redux store + router) so
 * feature components and URL-driven hooks can be tested in isolation.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = makeStore(preloadedState),
    initialEntries = ['/'],
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </I18nProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
