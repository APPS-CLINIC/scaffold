import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { CustomerDetailSection, CustomerField, type CustomerFieldRow } from './CustomerFields';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CustomerField', () => {
  it('renders the translated label with a hidden colon and the value inside its own dl', () => {
    render(
      <CustomerField labelKey="customers.details.generalData.field.taxId" value="5250000000" />,
    );

    const dl = screen.getByText('5250000000').closest('dl');
    expect(dl).not.toBeNull();
    expect(dl).toHaveTextContent('Tax ID:5250000000');
    const colon = within(dl as HTMLElement).getByText(':');
    expect(colon).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([null, undefined, ''])('renders the not-available fallback for %j', (value) => {
    render(
      <CustomerField
        labelKey="customers.details.generalData.field.taxId"
        value={value as string | null | undefined}
      />,
    );

    expect(screen.getByText('Tax ID').closest('dl')).toHaveTextContent(
      i18n.t('customers.value.notAvailable'),
    );
  });

  it('shows a skeleton and no value text while loading', () => {
    const { container } = render(
      <CustomerField
        labelKey="customers.details.generalData.field.taxId"
        value="5250000000"
        loading
      />,
    );

    expect(screen.queryByText('5250000000')).not.toBeInTheDocument();
    expect(container.querySelector('dd span.h-5[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('sets a title only for a non-empty string value in compact mode', () => {
    const { rerender } = render(
      <CustomerField
        labelKey="customers.details.generalData.field.taxId"
        value="5250000000"
        compact
      />,
    );
    expect(screen.getByText('5250000000')).toHaveAttribute('title', '5250000000');

    rerender(
      <CustomerField labelKey="customers.details.generalData.field.taxId" value="5250000000" />,
    );
    expect(screen.getByText('5250000000')).not.toHaveAttribute('title');
  });

  it('never sets a title on the empty-value fallback, even when compact', () => {
    render(
      <CustomerField labelKey="customers.details.generalData.field.taxId" value={null} compact />,
    );

    expect(screen.getByText(i18n.t('customers.value.notAvailable'))).not.toHaveAttribute('title');
  });

  it('renders each row as its own dl', () => {
    render(
      <>
        <CustomerField labelKey="customers.details.generalData.field.taxId" value="5250000000" />
        <CustomerField labelKey="customers.details.generalData.field.regon" value="012345678" />
      </>,
    );

    expect(document.querySelectorAll('dl')).toHaveLength(2);
  });
});

describe('CustomerDetailSection', () => {
  const rows: readonly CustomerFieldRow[] = [
    { labelKey: 'customers.details.generalData.field.taxId', value: '5250000000' },
    { labelKey: 'customers.details.generalData.field.regon', value: null },
  ];

  it('renders a Card > section[aria-labelledby] > h3 with rows in the configured order', () => {
    const { container } = render(
      <CustomerDetailSection
        titleKey="customers.details.generalData.section.basic"
        rows={rows}
        loading={false}
      />,
    );

    expect(container.querySelector('.p-card')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 3, name: 'Basic data' });
    const section = heading.closest('section');
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute('aria-labelledby', heading.id);

    const rowLabels = Array.from(section?.querySelectorAll('dt') ?? []).map((dt) => dt.textContent);
    expect(rowLabels).toEqual(['Tax ID:', 'REGON:']);
  });

  it('renders each configured group under its own sub-heading, split by one divider', () => {
    render(
      <CustomerDetailSection
        titleKey="customers.details.compliance.section.cdd"
        groups={[
          {
            titleKey: 'customers.details.compliance.subsection.dataIcbs',
            rows: [{ labelKey: 'customers.details.compliance.field.cddOwner', value: 'owner' }],
          },
          {
            titleKey: 'customers.details.compliance.subsection.scopeFileData',
            rows: [{ labelKey: 'customers.details.compliance.field.scopeFileGroup', value: null }],
          },
        ]}
        loading={false}
      />,
    );

    const section = screen.getByRole('heading', { level: 3, name: 'CDD' }).closest('section');
    if (!section) throw new Error('Expected a CDD section');
    expect(
      within(section).getByRole('heading', { level: 4, name: 'Data ICBS' }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole('heading', { level: 4, name: 'Scope file data' }),
    ).toBeInTheDocument();
    // One divider between the two groups, never before the first one.
    expect(section.querySelectorAll('hr')).toHaveLength(1);
    expect(within(section).getByText('owner')).toBeInTheDocument();
    expect(within(section).getByText('Group').closest('dl')).toHaveTextContent('–');
  });

  it('passes loading through to every row', () => {
    render(
      <CustomerDetailSection
        titleKey="customers.details.generalData.section.basic"
        rows={rows}
        loading
      />,
    );

    expect(screen.queryByText('5250000000')).not.toBeInTheDocument();
    expect(document.querySelectorAll('dd span.h-5[aria-hidden="true"]')).toHaveLength(2);
  });
});
