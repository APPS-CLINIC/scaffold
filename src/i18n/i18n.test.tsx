import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import i18n from '.';

function Sample() {
  const { t } = useTranslation();
  return (
    <div>
      <span data-testid="label">{t('common.search')}</span>
      <span data-testid="count">{t('common.results', { count: 3 })}</span>
    </div>
  );
}

describe('i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pl');
  });

  it('translates with the default (Polish) catalog', () => {
    render(<Sample />);
    expect(screen.getByTestId('label')).toHaveTextContent('Szukaj');
  });

  it('interpolates variables', () => {
    render(<Sample />);
    expect(screen.getByTestId('count')).toHaveTextContent('3 wyników');
  });

  it('switches language at runtime', async () => {
    await i18n.changeLanguage('en');
    render(<Sample />);
    expect(screen.getByTestId('label')).toHaveTextContent('Search');
  });
});
