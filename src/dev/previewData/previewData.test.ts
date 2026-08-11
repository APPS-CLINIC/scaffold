import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/app/store';
import { customersApi } from '@/features/customers/customers.api';
import { selectCustomerQuery } from '@/features/customers/customers.filters';
import { createUrlState } from '@/features/urlState/urlState.slice';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { seedPreviewData } from './previewData';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('preview data profiles', () => {
  it('seeds a transformed default customer page without requesting the backend', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore({ urlState: createUrlState('/customers/all') });

    await seedPreviewData(store, 'customers');

    const query = selectCustomerQuery(store.getState());
    const cached = customersApi.endpoints.getCustomers.select(query)(store.getState());
    expect(cached.status).toBe('fulfilled');
    expect(cached.data?.content[0]?.fullName).toBe('ARCELORMITTAL WARSAW SP. Z O.O.');
    expect(cached.data?.content[0]?.status).toBe('active');
    expect(cached.data?.page).toEqual({
      size: 10,
      number: 0,
      totalElements: 15,
      totalPages: 2,
    });

    await vi.advanceTimersByTimeAsync(61_000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(customersApi.endpoints.getCustomers.select(query)(store.getState()).status).toBe(
      'fulfilled',
    );
  });

  it('uses the backend transport for non-default customer queries', async () => {
    const fetchMock = installCustomerApiTestTransport();
    const store = makeStore({ urlState: createUrlState('/customers/all') });
    await seedPreviewData(store, 'customers');

    const pageTwoQuery = { ...selectCustomerQuery(store.getState()), page: 2 };
    const pageTwo = customersApi.endpoints.getCustomers.select(pageTwoQuery)(store.getState());

    expect(pageTwo.status).toBe('uninitialized');

    const subscription = store.dispatch(customersApi.endpoints.getCustomers.initiate(pageTwoQuery));
    await subscription;

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(vi.mocked(fetchMock).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        url: expect.stringContaining('/api/customers?page=1&size=10&sort=id%2CASC'),
      }),
    );
    subscription.unsubscribe();
  });

  it('rejects unknown profiles with the available profile name', async () => {
    const store = makeStore();

    await expect(seedPreviewData(store, 'unknown')).rejects.toThrow(
      'Unknown preview data profile "unknown". Available profiles: customers',
    );
  });
});
