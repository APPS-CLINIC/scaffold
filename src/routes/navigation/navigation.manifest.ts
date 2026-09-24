import { Settings } from 'ing-react-icons';
// Deliberately not the `@/ui` barrel. These icons are built while this module is
// evaluated, so pulling the whole barrel in makes the manifest depend on every UI
// primitive being initialised first — an import cycle then leaves `createPrimeIcon`
// undefined and fails with `(0 , createPrimeIcon) is not a function`.
import { createPrimeIcon } from '@/ui/createPrimeIcon';
import type { NavigationManifest } from './navigation.types';

const dashboardIcon = createPrimeIcon('home');
const generalDataIcon = createPrimeIcon('id-card');
const complianceIcon = createPrimeIcon('shield');
const fmDataIcon = createPrimeIcon('chart-line');
const reviewsIcon = createPrimeIcon('calendar');
const monitoringIcon = createPrimeIcon('eye');
const limitsIcon = createPrimeIcon('credit-card');
const productsIcon = createPrimeIcon('box');

/**
 * The single editable definition for every navigation surface. Route
 * components and domain data intentionally stay outside this manifest.
 */
export const navigationManifest = {
  defaultSection: 'home',
  fallbackItem: {
    id: 'overview',
    segment: '',
    labelKey: 'nav.sidebar.overview',
    icon: Settings,
    match: 'exact',
  },
  sections: [
    {
      id: 'home',
      path: '/',
      labelKey: 'nav.tab.start',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'portfolio',
      path: '/portfolio',
      labelKey: 'nav.tab.portfolio',
      defaultItem: 'dashboard',
      sidebar: {
        type: 'list',
        items: [
          {
            id: 'dashboard',
            segment: 'dashboard',
            labelKey: 'nav.portfolio.dashboard',
            icon: Settings,
          },
          {
            id: 'clients',
            segment: 'clients',
            labelKey: 'nav.portfolio.clients',
            icon: Settings,
          },
          {
            id: 'reviews',
            segment: 'reviews',
            labelKey: 'nav.portfolio.reviews',
            icon: Settings,
          },
          {
            id: 'ing-monitoring',
            segment: 'ing-monitoring',
            labelKey: 'nav.portfolio.ingMonitoring',
            icon: Settings,
          },
          {
            id: 'limits',
            segment: 'limits',
            labelKey: 'nav.portfolio.limits',
            icon: Settings,
          },
          {
            id: 'products',
            segment: 'products',
            labelKey: 'nav.portfolio.products',
            icon: Settings,
          },
          {
            id: 'financial-data',
            segment: 'financial-data',
            labelKey: 'nav.portfolio.financialData',
            icon: Settings,
          },
          {
            id: 'related-persons',
            segment: 'related-persons',
            labelKey: 'nav.portfolio.relatedPersons',
            icon: Settings,
          },
          {
            id: 'proxies',
            segment: 'proxies',
            labelKey: 'nav.portfolio.proxies',
            icon: Settings,
          },
          {
            id: 'iwa-documents',
            segment: 'iwa-documents',
            labelKey: 'nav.portfolio.iwaDocuments',
            icon: Settings,
          },
          {
            id: 'audit-process',
            segment: 'audit-process',
            labelKey: 'nav.portfolio.auditProcess',
            icon: Settings,
          },
        ],
      },
    },
    {
      id: 'customers',
      path: '/customers',
      labelKey: 'nav.tab.customers',
      defaultItem: 'all-customers',
      sidebar: {
        type: 'list',
        items: [
          {
            id: 'all-customers',
            segment: 'all',
            labelKey: 'nav.customers.all',
            icon: Settings,
            match: 'exact',
          },
        ],
      },
      context: {
        id: 'customer-detail',
        parameter: 'id',
        ariaLabelKey: 'nav.customerDetail.navigation',
        topBar: 'global',
        defaultItem: 'general-data',
        sidebar: {
          type: 'tree',
          items: [
            {
              id: 'dashboard',
              segment: 'dashboard',
              labelKey: 'nav.customerDetail.dashboard',
              icon: dashboardIcon,
            },
            {
              id: 'general-data',
              segment: 'general-data',
              labelKey: 'nav.customerDetail.generalData',
              icon: generalDataIcon,
            },
            {
              id: 'cdd-crs-fatca',
              segment: 'cdd-crs-fatca',
              labelKey: 'nav.customerDetail.cddCrsFatca',
              icon: complianceIcon,
            },
            {
              id: 'fm-data',
              segment: 'fm-data',
              labelKey: 'nav.customerDetail.fmData',
              icon: fmDataIcon,
            },
            {
              id: 'reviews',
              segment: 'reviews',
              labelKey: 'nav.customerDetail.reviews',
              icon: reviewsIcon,
            },
            {
              id: 'monitoring',
              segment: 'monitoring',
              labelKey: 'nav.customerDetail.monitoring',
              icon: monitoringIcon,
            },
            {
              id: 'limits',
              segment: 'limits',
              labelKey: 'nav.customerDetail.limits',
              icon: limitsIcon,
            },
            {
              id: 'products',
              segment: 'products',
              labelKey: 'nav.customerDetail.products',
              icon: productsIcon,
            },
          ],
        },
        breadcrumb: { rootItem: 'all-customers' },
      },
    },
    {
      id: 'groups',
      path: '/groups',
      labelKey: 'nav.tab.groups',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'targets',
      path: '/targets',
      labelKey: 'nav.tab.targets',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'pipeline',
      path: '/pipeline',
      labelKey: 'nav.tab.pipeline',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'orders',
      path: '/orders',
      labelKey: 'nav.tab.orders',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'transactions',
      path: '/transactions',
      labelKey: 'nav.tab.transactions',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'bi-reports',
      path: '/bi-reports',
      labelKey: 'nav.tab.reportsBi',
      sidebar: { type: 'list', items: [] },
    },
    {
      id: 'calendar',
      path: '/calendar',
      labelKey: 'nav.tab.calendar',
      sidebar: { type: 'list', items: [] },
    },
  ],
} as const satisfies NavigationManifest;

export type NavigationManifestSection = (typeof navigationManifest.sections)[number];
export type NavigationSectionKey = NavigationManifestSection['id'];
