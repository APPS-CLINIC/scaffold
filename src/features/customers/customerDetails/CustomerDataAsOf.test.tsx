import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerDataAsOf } from './CustomerDataAsOf';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CustomerDataAsOf', () => {
  it('dates the shown data by when it arrived', () => {
    renderWithProviders(
      <CustomerDataAsOf
        fulfilledTimeStamp={new Date('2026-06-12T09:30:00').getTime()}
        onRefresh={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText('As of:')).toBeInTheDocument();
    expect(screen.getByText('06/12/2026')).toBeInTheDocument();
  });

  it('asks the owner to fetch the data again', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn(async () => undefined);
    renderWithProviders(<CustomerDataAsOf fulfilledTimeStamp={undefined} onRefresh={onRefresh} />);

    await user.click(screen.getByText('Refresh'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
