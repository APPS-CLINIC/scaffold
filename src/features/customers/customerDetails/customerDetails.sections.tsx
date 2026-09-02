import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { Status, type KeyValueSection } from '@/ui';
import { createEmptyCustomerAdvisors, createEmptyCustomerDetails } from './customerDetails.adapter';
import {
  formatCustomerAddress,
  formatCustomerBoolean,
  formatCustomerDate,
  isPastCustomerDate,
} from './customerDetails.formatters';
import type { CustomerAddress, CustomerAdvisors, CustomerDetails } from './customerDetails.types';
import type { CustomerSummary } from '../customerSummary';

type ConfiguredValue = string | boolean | CustomerAddress | null;
type ValueFormat = 'text' | 'date' | 'boolean' | 'address' | 'expirationDate';

interface CustomerDetailFieldConfig<T> {
  id: string;
  labelKey: MessageKey;
  value: (source: T) => ConfiguredValue;
  format?: ValueFormat;
}

interface CustomerDetailSectionConfig<T> {
  id: string;
  titleKey: MessageKey;
  fields: readonly CustomerDetailFieldConfig<T>[];
}

interface GeneralDataSource {
  details: CustomerDetails;
  advisors: CustomerAdvisors;
}

interface ComplianceSource {
  details: CustomerDetails;
  summary: CustomerSummary | null;
}

const unavailableValue = (): null => null;

const GENERAL_DATA_CONFIG = [
  {
    id: 'basic',
    titleKey: 'customers.details.generalData.section.basic',
    fields: [
      {
        id: 'catalogOpenDate',
        labelKey: 'customers.details.generalData.field.catalogOpenDate',
        value: ({ details }) => details.basicData.catalogOpenDate,
        format: 'date',
      },
      {
        id: 'taxId',
        labelKey: 'customers.details.generalData.field.taxId',
        value: ({ details }) => details.basicData.taxId,
      },
      {
        id: 'regon',
        labelKey: 'customers.details.generalData.field.regon',
        value: ({ details }) => details.basicData.regon,
      },
      {
        id: 'krs',
        labelKey: 'customers.details.generalData.field.krs',
        value: ({ details }) => details.basicData.krs,
      },
      {
        id: 'residenceCountry',
        labelKey: 'customers.details.generalData.field.residenceCountry',
        value: ({ details }) => details.basicData.residenceCountry,
      },
      {
        id: 'registrationCountry',
        labelKey: 'customers.details.generalData.field.registrationCountry',
        value: ({ details }) => details.basicData.registrationCountry,
      },
      {
        id: 'customerType',
        labelKey: 'customers.details.generalData.field.customerType',
        value: ({ details }) => details.basicData.customerType,
      },
      {
        id: 'sector',
        labelKey: 'customers.details.generalData.field.sector',
        value: ({ details }) => details.basicData.sector,
      },
      {
        id: 'subSector',
        labelKey: 'customers.details.generalData.field.subSector',
        value: ({ details }) => details.basicData.subSector,
      },
      {
        id: 'nbpEntityType',
        labelKey: 'customers.details.generalData.field.nbpEntityType',
        value: ({ details }) => details.basicData.nbpEntityType,
      },
      {
        id: 'nbpEntityTypeDescription',
        labelKey: 'customers.details.generalData.field.nbpEntityTypeDescription',
        value: ({ details }) => details.basicData.nbpEntityTypeDescription,
      },
      {
        id: 'mifidClassification',
        labelKey: 'customers.details.generalData.field.mifidClassification',
        value: ({ details }) => details.mifid.mifidClassification,
      },
      {
        id: 'leiCode',
        labelKey: 'customers.details.generalData.field.leiCode',
        value: ({ details }) => details.lei.leiCode,
      },
      {
        id: 'leiCodeValidityDate',
        labelKey: 'customers.details.generalData.field.leiCodeValidityDate',
        value: ({ details }) => details.lei.leiCodeValidityDate,
        format: 'date',
      },
      {
        id: 'emirClassification',
        labelKey: 'customers.details.generalData.field.emirClassification',
        value: ({ details }) => details.emir.emirClassification,
      },
      {
        id: 'naicsCode',
        labelKey: 'customers.details.generalData.field.naicsCode',
        value: ({ details }) => details.basicData.naicsCode,
      },
      {
        id: 'naicsName',
        labelKey: 'customers.details.generalData.field.naicsName',
        value: ({ details }) => details.basicData.naicsName,
      },
    ],
  },
  {
    id: 'addresses',
    titleKey: 'customers.details.generalData.section.addresses',
    fields: [
      {
        id: 'mainAddress',
        labelKey: 'customers.details.generalData.field.mainAddress',
        value: ({ details }) => details.addresses.mainAddress,
        format: 'address',
      },
      {
        id: 'mailingAddress',
        labelKey: 'customers.details.generalData.field.mailingAddress',
        value: ({ details }) => details.addresses.mailingAddress,
        format: 'address',
      },
    ],
  },
  {
    id: 'advisors',
    titleKey: 'customers.details.generalData.section.advisors',
    fields: [
      {
        id: 'rmAdvisor',
        labelKey: 'customers.details.generalData.field.rmAdvisor',
        value: ({ advisors }) => advisors.rmAdvisor,
      },
      {
        id: 'lendingAdvisor',
        labelKey: 'customers.details.generalData.field.lendingAdvisor',
        value: ({ advisors }) => advisors.lendingAdvisor,
      },
      {
        id: 'sfAdvisor',
        labelKey: 'customers.details.generalData.field.sfAdvisor',
        value: ({ advisors }) => advisors.sfAdvisor,
      },
      {
        id: 'pcmAdvisor',
        labelKey: 'customers.details.generalData.field.pcmAdvisor',
        value: ({ advisors }) => advisors.pcmAdvisor,
      },
      {
        id: 'fmAdvisor',
        labelKey: 'customers.details.generalData.field.fmAdvisor',
        value: ({ advisors }) => advisors.fmAdvisor,
      },
      {
        id: 'tsAdvisor',
        labelKey: 'customers.details.generalData.field.tsAdvisor',
        value: ({ advisors }) => advisors.tsAdvisor,
      },
      {
        id: 'ebdAdvisor',
        labelKey: 'customers.details.generalData.field.ebdAdvisor',
        value: ({ advisors }) => advisors.ebdAdvisor,
      },
      {
        id: 'implementationAdvisor',
        labelKey: 'customers.details.generalData.field.implementationAdvisor',
        value: ({ advisors }) => advisors.implementationAdvisor,
      },
      {
        id: 'customerServiceAdvisor',
        labelKey: 'customers.details.generalData.field.customerServiceAdvisor',
        value: ({ advisors }) => advisors.customerServiceAdvisor,
      },
    ],
  },
  {
    id: 'consents',
    titleKey: 'customers.details.generalData.section.consents',
    fields: [
      {
        id: 'electronicBskMarketingConsent',
        labelKey: 'customers.details.generalData.field.electronicBskMarketingConsent',
        value: ({ details }) => details.consents.electronicBskMarketingConsent,
        format: 'boolean',
      },
      {
        id: 'nvTransferConsent',
        labelKey: 'customers.details.generalData.field.nvTransferConsent',
        value: ({ details }) => details.consents.nvTransferConsent,
        format: 'boolean',
      },
      {
        id: 'bskTransferConsent',
        labelKey: 'customers.details.generalData.field.bskTransferConsent',
        value: ({ details }) => details.consents.bskTransferConsent,
        format: 'boolean',
      },
      {
        id: 'traditionalBskMarketingConsent',
        labelKey: 'customers.details.generalData.field.traditionalBskMarketingConsent',
        value: ({ details }) => details.consents.traditionalBskMarketingConsent,
        format: 'boolean',
      },
      {
        id: 'udbTransferConsent',
        labelKey: 'customers.details.generalData.field.udbTransferConsent',
        value: ({ details }) => details.consents.udbTransferConsent,
        format: 'boolean',
      },
      {
        id: 'fromIngLeaseConsent',
        labelKey: 'customers.details.generalData.field.fromIngLeaseConsent',
        value: ({ details }) => details.consents.fromIngLeaseConsent,
        format: 'boolean',
      },
      {
        id: 'toIngLeaseConsent',
        labelKey: 'customers.details.generalData.field.toIngLeaseConsent',
        value: ({ details }) => details.consents.toIngLeaseConsent,
        format: 'boolean',
      },
      {
        id: 'fromCommercialFinanceConsent',
        labelKey: 'customers.details.generalData.field.fromCommercialFinanceConsent',
        value: ({ details }) => details.consents.fromCommercialFinanceConsent,
        format: 'boolean',
      },
      {
        id: 'toCommercialFinanceConsent',
        labelKey: 'customers.details.generalData.field.toCommercialFinanceConsent',
        value: ({ details }) => details.consents.toCommercialFinanceConsent,
        format: 'boolean',
      },
      {
        id: 'outsideBankConsent',
        labelKey: 'customers.details.generalData.field.outsideBankConsent',
        value: ({ details }) => details.consents.outsideBankConsent,
        format: 'boolean',
      },
    ],
  },
] as const satisfies readonly CustomerDetailSectionConfig<GeneralDataSource>[];

/**
 * Rows visible in the design stay configured even when their backend binding
 * has not been confirmed. Those rows deliberately resolve to `null` and use
 * the shared empty-value presentation instead of inventing transport fields.
 */
const COMPLIANCE_CONFIG = [
  {
    id: 'cdd',
    titleKey: 'customers.details.compliance.section.cdd',
    fields: [
      {
        id: 'cddDate',
        labelKey: 'customers.details.compliance.field.cddDate',
        value: unavailableValue,
      },
      {
        id: 'cddRiskLevel',
        labelKey: 'customers.details.compliance.field.cddRiskLevel',
        value: ({ summary }) => summary?.cddRiskLevel ?? null,
      },
      {
        id: 'cddExpirationDate',
        labelKey: 'customers.details.compliance.field.cddExpirationDate',
        value: ({ summary }) => summary?.cddExpirationDate ?? null,
        format: 'expirationDate',
      },
      {
        id: 'cddAssessmentDate',
        labelKey: 'customers.details.compliance.field.cddAssessmentDate',
        value: unavailableValue,
      },
      {
        id: 'cddRiskLevelVintage',
        labelKey: 'customers.details.compliance.field.cddRiskLevelVintage',
        value: unavailableValue,
      },
      {
        id: 'cddExpirationDateVintage',
        labelKey: 'customers.details.compliance.field.cddExpirationDateVintage',
        value: unavailableValue,
      },
      {
        id: 'cddOwner',
        labelKey: 'customers.details.compliance.field.cddOwner',
        value: unavailableValue,
      },
      {
        id: 'cddFirstGeneration',
        labelKey: 'customers.details.compliance.field.cddFirstGeneration',
        value: unavailableValue,
      },
      {
        id: 'cddSecondGeneration',
        labelKey: 'customers.details.compliance.field.cddSecondGeneration',
        value: unavailableValue,
      },
      {
        id: 'mlrdDeviationFrom',
        labelKey: 'customers.details.compliance.field.mlrdDeviationFrom',
        value: unavailableValue,
      },
      {
        id: 'mlrdDeviationTo',
        labelKey: 'customers.details.compliance.field.mlrdDeviationTo',
        value: unavailableValue,
      },
      {
        id: 'mlrdDeviationFlag',
        labelKey: 'customers.details.compliance.field.mlrdDeviationFlag',
        value: unavailableValue,
      },
    ],
  },
  {
    id: 'segmentation',
    titleKey: 'customers.details.compliance.section.segmentation',
    fields: [
      {
        id: 'segmentationGroup',
        labelKey: 'customers.details.compliance.field.segmentationGroup',
        value: unavailableValue,
      },
      {
        id: 'segmentationCluster',
        labelKey: 'customers.details.compliance.field.segmentationCluster',
        value: unavailableValue,
      },
      {
        id: 'segmentationSprint',
        labelKey: 'customers.details.compliance.field.segmentationSprint',
        value: unavailableValue,
      },
      {
        id: 'segmentationSprintStartDate',
        labelKey: 'customers.details.compliance.field.segmentationSprintStartDate',
        value: unavailableValue,
      },
      {
        id: 'segmentationSprintEndDate',
        labelKey: 'customers.details.compliance.field.segmentationSprintEndDate',
        value: unavailableValue,
      },
    ],
  },
  {
    id: 'crs',
    titleKey: 'customers.details.compliance.section.crs',
    fields: [
      {
        id: 'crsProcessType',
        labelKey: 'customers.details.compliance.field.crsProcessType',
        value: ({ details }) => details.crs.crsProcessType,
      },
      {
        id: 'crsReviewDate',
        labelKey: 'customers.details.compliance.field.crsReviewDate',
        value: ({ details }) => details.crs.crsReviewDate,
        format: 'date',
      },
      {
        id: 'crsStatus',
        labelKey: 'customers.details.compliance.field.crsStatus',
        value: ({ details }) => details.crs.crsStatus,
      },
      {
        id: 'crsClassificationDate',
        labelKey: 'customers.details.compliance.field.crsClassificationDate',
        value: ({ details }) => details.crs.crsClassificationDate,
        format: 'date',
      },
    ],
  },
  {
    id: 'fatca',
    titleKey: 'customers.details.compliance.section.fatca',
    fields: [
      {
        id: 'fatcaReviewType',
        labelKey: 'customers.details.compliance.field.fatcaReviewType',
        value: ({ details }) => details.fatca.fatcaReviewType,
      },
      {
        id: 'fatcaReviewDate',
        labelKey: 'customers.details.compliance.field.fatcaReviewDate',
        value: ({ details }) => details.fatca.fatcaReviewDate,
        format: 'expirationDate',
      },
      {
        id: 'fatcaStatus',
        labelKey: 'customers.details.compliance.field.fatcaStatus',
        value: ({ details }) => details.fatca.fatcaStatus,
      },
      {
        id: 'fatcaClassificationDate',
        labelKey: 'customers.details.compliance.field.fatcaClassificationDate',
        value: ({ details }) => details.fatca.fatcaClassificationDate,
        format: 'date',
      },
    ],
  },
] as const satisfies readonly CustomerDetailSectionConfig<ComplianceSource>[];

function renderConfiguredValue(
  value: ConfiguredValue,
  format: ValueFormat,
  t: TFunction,
  locale: string,
): ReactNode {
  switch (format) {
    case 'date':
      return formatCustomerDate(typeof value === 'string' ? value : null, locale);
    case 'boolean':
      return formatCustomerBoolean(typeof value === 'boolean' ? value : null, {
        yes: t('common.yes'),
        no: t('common.no'),
      });
    case 'address':
      return formatCustomerAddress(typeof value === 'object' ? value : null);
    case 'expirationDate': {
      const rawDate = typeof value === 'string' ? value : null;
      const formattedDate = formatCustomerDate(rawDate, locale);
      if (!formattedDate) return null;

      return (
        <span className="inline-flex flex-wrap items-center gap-2">
          {isPastCustomerDate(rawDate) ? (
            <Status
              type="incomplete"
              label={t('customers.details.compliance.status.overdue')}
              className="[&_*]:!text-sm [&_*]:!leading-5"
            />
          ) : null}
          <time dateTime={rawDate ?? undefined}>{formattedDate}</time>
        </span>
      );
    }
    default:
      return typeof value === 'string' ? value : null;
  }
}

function buildSections<T>(
  config: readonly CustomerDetailSectionConfig<T>[],
  source: T,
  t: TFunction,
  locale: string,
): KeyValueSection[] {
  return config.map((section) => ({
    id: section.id,
    title: t(section.titleKey),
    items: section.fields.map((field) => ({
      id: field.id,
      label: t(field.labelKey),
      value: renderConfiguredValue(field.value(source), field.format ?? 'text', t, locale),
    })),
  }));
}

export function createGeneralDataSections(
  details: CustomerDetails | undefined,
  advisors: CustomerAdvisors | undefined,
  t: TFunction,
  locale: string,
): KeyValueSection[] {
  return buildSections(
    GENERAL_DATA_CONFIG,
    {
      details: details ?? createEmptyCustomerDetails(),
      advisors: advisors ?? createEmptyCustomerAdvisors(),
    },
    t,
    locale,
  );
}

export function createComplianceSections(
  details: CustomerDetails | undefined,
  summary: CustomerSummary | null,
  t: TFunction,
  locale: string,
): KeyValueSection[] {
  return buildSections(
    COMPLIANCE_CONFIG,
    { details: details ?? createEmptyCustomerDetails(), summary },
    t,
    locale,
  );
}
