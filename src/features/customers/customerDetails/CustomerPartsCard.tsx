import type { ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageKey } from '@/i18n/messages/pl';
import { Card, TabMenu } from '@/ui';

/** One entry of a detail section's in-page part menu; the segment is the last URL segment. */
export interface CustomerSectionPart {
  id: string;
  segment: string;
  labelKey: MessageKey;
}

export interface CustomerPartsCardProps {
  groupLabelKey: MessageKey;
  menuLabelKey: MessageKey;
  parts: readonly CustomerSectionPart[];
  activePart: CustomerSectionPart;
  onSelectPart: (part: CustomerSectionPart) => void;
  /** The active part's content, including its heading. */
  children: ReactNode;
}

/**
 * One card holding a detail section's part menu and the active part. The owner keeps the active
 * part in the URL, so the card never stores it.
 */
export function CustomerPartsCard({
  groupLabelKey,
  menuLabelKey,
  parts,
  activePart,
  onSelectPart,
  children,
}: CustomerPartsCardProps) {
  const { t } = useTranslation();
  const activeIndex = parts.findIndex((item) => item.id === activePart.id);

  return (
    <Card>
      <div role="group" aria-label={t(groupLabelKey)} className="min-w-0">
        {/* IWA TabMenu takes no className, so its label size is set from this container. */}
        <nav aria-label={t(menuLabelKey)} className="[&_*]:![font-size:0.875rem]">
          <TabMenu
            activeIndex={activeIndex}
            items={parts.map((item) => ({ label: t(item.labelKey) }))}
            // The prop is typed as Dispatch<SetStateAction<number>>, so it must also accept
            // an updater function; resolve it against the index the URL selects.
            onChangeActiveIndex={(value: SetStateAction<number>) => {
              const index = typeof value === 'function' ? value(activeIndex) : value;
              const selected = parts[index];
              if (selected && selected.id !== activePart.id) onSelectPart(selected);
            }}
          />
        </nav>
        <div className="mt-4 min-w-0">{children}</div>
      </div>
    </Card>
  );
}
