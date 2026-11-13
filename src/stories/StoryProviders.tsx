import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import { makeStore } from '@/app/store';
import { baseApi } from '@/api/baseApi';
import i18n from '@/i18n';
import { createUrlState } from '@/features/urlState/urlState.slice';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import { ToastProvider } from '@/ui/toast/ToastProvider';
import { createFacilitiesScenario } from './facilities/scenarios';
import type { FacilitiesScenario } from './facilities/scenarios';

export interface StoryProvidersProps {
  children: ReactNode;
  locale?: 'en' | 'pl';
  route?: string;
  facilitiesScenario?: FacilitiesScenario;
}

/** Each Canvas/Docs instance owns its router, cache and translations; nothing is persisted. */
export function StoryProviders({
  children,
  locale = 'en',
  route = '/stories/table',
  facilitiesScenario = 'default',
}: StoryProvidersProps) {
  const [environment] = useState(() => {
    const url = new URL(route, 'https://storybook.example');
    return {
      i18n: i18n.cloneInstance({ lng: locale }),
      store: makeStore(
        { urlState: createUrlState(url.pathname, url.search) },
        {
          listenToBrowserEvents: false,
          extraArgument: {
            facilitiesPreviewTransport: createFacilitiesScenario(facilitiesScenario),
          },
        },
      ),
    };
  });
  useEffect(
    () => () => {
      environment.store
        .dispatch(baseApi.util.getRunningQueriesThunk())
        .forEach((request) => request.abort());
      environment.store.dispatch(baseApi.util.resetApiState());
    },
    [environment],
  );
  return (
    <I18nextProvider i18n={environment.i18n}>
      <PrimeReactProvider>
        <Provider store={environment.store}>
          <MemoryRouter initialEntries={[route]}>
            <UrlStateSync />
            <ToastProvider>
              <div lang={locale} className="min-w-0 text-[var(--text)]">
                {children}
              </div>
            </ToastProvider>
          </MemoryRouter>
        </Provider>
      </PrimeReactProvider>
    </I18nextProvider>
  );
}
