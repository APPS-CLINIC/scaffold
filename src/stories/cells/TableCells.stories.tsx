import { useTranslation } from 'react-i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  TextCell,
  TableCellSkeleton,
  UnderlinedTextCell,
  DateCell,
  OverdueDateCell,
  ActiveArchivalStatusCell,
} from '@/ui';
import { createExampleRows } from '../tables/tableFixtures';

function CellExample({
  kind = 'text',
  missing = false,
  archived = false,
}: {
  kind?: 'text' | 'link' | 'date' | 'overdue' | 'status' | 'placeholder';
  missing?: boolean;
  archived?: boolean;
}) {
  const { i18n } = useTranslation();
  const row = createExampleRows(1)[0];
  if (!row) return null;
  const props = {
    row,
    rowIndex: 0,
    locale: i18n.resolvedLanguage ?? i18n.language,
    notAvailable: '–',
  };
  return (
    <div className="max-w-80 break-words rounded border border-[var(--border)] p-4">
      {kind === 'placeholder' ? (
        <TableCellSkeleton />
      ) : kind === 'status' ? (
        <ActiveArchivalStatusCell
          {...props}
          field="status"
          value={archived ? 'ARCHIVAL' : 'ACTIVE'}
        />
      ) : kind === 'date' ? (
        <DateCell {...props} field="lendingReviewDate" value={missing ? null : '2030-06-15'} />
      ) : kind === 'overdue' ? (
        <OverdueDateCell
          {...props}
          field="lendingReviewDate"
          value={missing ? null : '2000-06-15'}
        />
      ) : kind === 'link' ? (
        <UnderlinedTextCell {...props} field="fullName" value={row.fullName} to="/customers/1" />
      ) : (
        <TextCell
          {...props}
          field="lendingAdvisor"
          value={
            missing
              ? null
              : 'A long example value that should wrap without overflowing the configured table cell.'
          }
        />
      )}
    </div>
  );
}
const meta = {
  title: 'Table cells/Shared cells',
  component: CellExample,
  args: { kind: 'text', missing: false, archived: false },
  parameters: {
    docs: {
      description: {
        component:
          'The existing TextCell, UnderlinedTextCell, DateCell, OverdueDateCell and ActiveArchivalStatusCell. Generic and hierarchy tables use these through TableCell; no alternative cell markup is introduced.',
      },
    },
  },
} satisfies Meta<typeof CellExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WrappedText: Story = {};
export const MissingValue: Story = { args: { missing: true } };
export const InternalLink: Story = { args: { kind: 'link' } };
export const Date: Story = { args: { kind: 'date' } };
export const OverdueDate: Story = { args: { kind: 'overdue' } };
export const Active: Story = { args: { kind: 'status' } };
export const Archival: Story = { args: { kind: 'status', archived: true } };

export const PendingCell: Story = { args: { kind: 'placeholder' } };
