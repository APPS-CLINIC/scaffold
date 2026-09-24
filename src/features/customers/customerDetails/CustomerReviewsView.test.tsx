import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import { CustomerReviewsView } from './CustomerReviewsView';
import { CUSTOMER_REVIEWS_PARTS, type CustomerReviewsPart } from './customerReviews.parts';

const facilities = CUSTOMER_REVIEWS_PARTS[1];
const collaterals = CUSTOMER_REVIEWS_PARTS[2];

/** The part menu, scoped so a tab is never confused with the heading of the shown part. */
function menu() {
  return within(screen.getByRole('navigation', { name: 'Review parts' }));
}

function renderView(part: CustomerReviewsPart, onSelectPart = vi.fn()) {
  renderWithProviders(
    <CustomerReviewsView customerId="23997" part={part} onSelectPart={onSelectPart} />,
  );

  return onSelectPart;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CustomerReviewsView', () => {
  it('names the section and its part menu for assistive technology', () => {
    renderView(facilities);

    const section = screen.getByRole('group', { name: 'Customer reviews' });
    expect(within(section).getByRole('navigation', { name: 'Review parts' })).toBeInTheDocument();
  });

  it('offers every configured part and titles the one the URL selected', () => {
    renderView(facilities);

    for (const label of ['Review dates', 'Facilities', 'Collateral']) {
      expect(menu().getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { level: 3, name: 'Facilities' })).toBeInTheDocument();
    expect(screen.getByText(i18n.t('section.placeholder'))).toBeInTheDocument();
  });

  it('reports the picked part instead of switching on its own', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(facilities);

    await user.click(menu().getByText('Collateral'));

    expect(onSelectPart).toHaveBeenCalledWith(collaterals);
    expect(screen.getByRole('heading', { level: 3, name: 'Facilities' })).toBeInTheDocument();
  });

  it('stays quiet when the active part is picked again', async () => {
    const user = userEvent.setup();
    const onSelectPart = renderView(facilities);

    await user.click(menu().getByText('Facilities'));

    expect(onSelectPart).not.toHaveBeenCalled();
  });
});
