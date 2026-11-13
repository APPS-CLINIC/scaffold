import type { MessageKey } from '@/i18n/messages/pl';
import type { FacilityGroup } from './facilities.types';

export const FACILITY_GROUP_LABELS: Record<FacilityGroup, MessageKey> = {
  LENDING: 'facilities.group.lending',
  TFS: 'facilities.group.tfs',
  INTRADAY: 'facilities.group.intraday',
  INVESTMENT: 'facilities.group.investment',
  CARD: 'facilities.group.card',
  OTHER: 'facilities.group.other',
};
