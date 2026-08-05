import type { AppStore } from '@/app/store';
import { defaultListQuery } from '@/features/urlState/urlState.schema';
import { customersApi, mapCustomerPageResponse } from '@/features/customers/customers.api';
import { toCustomerQuery } from '@/features/customers/customers.filters';
import { customerFirstPageResponse } from './customers.fixture';

/** Seed and retain only the default query; every different query still uses the backend. */
export function seedCustomerPreviewData(store: AppStore): void {
  const query = toCustomerQuery(defaultListQuery);

  store.dispatch(
    customersApi.util.upsertQueryEntries([
      {
        endpointName: 'getCustomers',
        arg: query,
        value: mapCustomerPageResponse(customerFirstPageResponse),
      },
    ]),
  );

  // Keep the seed available if the developer opens this route later. Because
  // the cache entry is already fulfilled, subscribing does not issue a request.
  void store.dispatch(customersApi.endpoints.getCustomers.initiate(query));
}
