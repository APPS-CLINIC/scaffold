import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from './I18nProvider';
import { useI18n, useT } from './useT';

function Sample() {
  const t = useT();
  const { locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="label">{t('common.search')}</span>
      <span data-testid="count">{t('common.results', { count: 3 })}</span>
      <span data-testid="locale">{locale}</span>
      <button type="button" onClick={() => setLocale('en')}>
        switch
      </button>
    </div>
  );
}

describe('i18n', () => {
  it('translates with the default (Polish) catalog', () => {
    render(
      <I18nProvider>
        <Sample />
      </I18nProvider>,
    );
    expect(screen.getByTestId('label')).toHaveTextContent('Szukaj');
  });

  it('interpolates variables', () => {
    render(
      <I18nProvider>
        <Sample />
      </I18nProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('3 wyników');
  });

  it('switches locale at runtime', async () => {
    render(
      <I18nProvider>
        <Sample />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'switch' }));
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Search');
  });
});
