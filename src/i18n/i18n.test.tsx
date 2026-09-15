import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import i18n from '.';
import { en } from './messages/en';
import { pl, type MessageKey } from './messages/pl';

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
    expect(screen.getByTestId('label')).toHaveTextContent(pl['common.search']);
  });

  it('interpolates variables', () => {
    render(<Sample />);
    expect(screen.getByTestId('count')).toHaveTextContent(
      pl['common.results'].replace('{{count}}', '3'),
    );
  });

  it('switches language at runtime', async () => {
    await i18n.changeLanguage('en');
    render(<Sample />);
    expect(screen.getByTestId('label')).toHaveTextContent('Search');
  });

  it('pluralises the overdue message per language', async () => {
    const overdueDays = (count: number) => i18n.t('customers.overdueDays', { count });
    const catalog = (messages: Record<MessageKey, string>, key: MessageKey, count: number) =>
      messages[key].replace('{{count}}', String(count));

    expect(overdueDays(1)).toBe(catalog(pl, 'customers.overdueDays_one', 1));
    expect(overdueDays(2)).toBe(catalog(pl, 'customers.overdueDays_few', 2));
    expect(overdueDays(5)).toBe(catalog(pl, 'customers.overdueDays_many', 5));
    expect(overdueDays(22)).toBe(catalog(pl, 'customers.overdueDays_few', 22));

    await i18n.changeLanguage('en');
    expect(overdueDays(1)).toBe(catalog(en, 'customers.overdueDays_one', 1));
    expect(overdueDays(3)).toBe(catalog(en, 'customers.overdueDays_other', 3));
  });
});
