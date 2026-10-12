import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import i18n, { chooseLanguage } from '.';
import { pl } from './messages/pl';

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

  it('keeps the page language in step with the app language', async () => {
    expect(document.documentElement.lang).toBe('pl');

    await i18n.changeLanguage('en');

    expect(document.documentElement.lang).toBe('en');
  });

  it('starts in the language the user picked last in this browser', async () => {
    window.localStorage.setItem('scaffold.language', 'en');
    vi.resetModules();

    const { default: started } = await import('.');

    await vi.waitFor(() => expect(started.resolvedLanguage).toBe('en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('remembers the language the user picks for the next visit', async () => {
    await chooseLanguage('en');

    expect(i18n.resolvedLanguage).toBe('en');
    expect(window.localStorage.getItem('scaffold.language')).toBe('en');
  });
});

afterEach(() => {
  window.localStorage.clear();
});
