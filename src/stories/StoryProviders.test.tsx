import { render, screen, within } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { useLocation } from 'react-router-dom';
import { StoryProviders } from './StoryProviders';

function Probe() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <>
      <p>{t('common.empty')}</p>
      <output>{location.pathname + location.search}</output>
    </>
  );
}
describe('Story providers', () => {
  it('isolates translations and URL state between simultaneous story instances', () => {
    render(
      <>
        <section aria-label="English instance">
          <StoryProviders locale="en" route="/stories/a?q=first">
            <Probe />
          </StoryProviders>
        </section>
        <section aria-label="Polish instance">
          <StoryProviders locale="pl" route="/stories/b?q=second">
            <Probe />
          </StoryProviders>
        </section>
      </>,
    );
    const english = within(screen.getByRole('region', { name: 'English instance' }));
    const polish = within(screen.getByRole('region', { name: 'Polish instance' }));
    expect(english.getByText('No data')).toBeInTheDocument();
    expect(english.getByRole('status')).toHaveTextContent('/stories/a?q=first');
    expect(polish.getByText('Brak danych')).toBeInTheDocument();
    expect(polish.getByRole('status')).toHaveTextContent('/stories/b?q=second');
  });
});
