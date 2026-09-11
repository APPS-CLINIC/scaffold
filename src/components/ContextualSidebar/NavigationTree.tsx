import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ResolvedNavigationNode } from '@/routes/navigation';
import {
  NavigationIcon,
  NavigationMenuItem,
  PrimeIcon,
  twMerge,
  type NavigationMenuSubNode,
} from '@/ui';

interface NavigationTreeRowProps {
  item: ResolvedNavigationNode;
  expandedIds: readonly string[];
  isCollapsed: boolean;
  depth: number;
}

function NavigationTreeRow({ item, expandedIds, isCollapsed, depth }: NavigationTreeRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldExpand = expandedIds.includes(item.id);
  const hasChildren = item.children.length > 0;
  const usesNativeSubNodes =
    hasChildren && item.children.every((child) => child.children.length === 0);
  const [expanded, setExpanded] = useState(shouldExpand);
  const itemLabel = t(item.labelKey);

  // Opening a deep link expands its active ancestors, while branches that the
  // user opened manually remain open until this navigation surface unmounts.
  useEffect(() => {
    if (shouldExpand) setExpanded(true);
  }, [shouldExpand]);

  const subNodes: NavigationMenuSubNode[] =
    usesNativeSubNodes && expanded && !isCollapsed
      ? item.children.map((child) => ({
          id: child.id,
          label: t(child.labelKey),
          isActive: child.isActive,
          onClick: () => navigate(child.path),
        }))
      : [];
  const showsRecursiveChildren = hasChildren && !usesNativeSubNodes;
  const toggleLabel = `${t(
    expanded ? 'nav.sidebar.collapse' : 'nav.sidebar.expand',
  )}: ${itemLabel}`;

  return (
    <li className="min-w-0">
      <NavigationMenuItem
        rootClassName="w-full min-w-0"
        listClassName={twMerge(
          'm-0 list-none space-y-0.5 py-0.5 pl-12 pr-2',
          '[&_button]:min-h-11 [&_button]:w-full [&_button]:px-3 [&_button]:text-left',
          '[&_button]:no-underline [&_button]:underline-offset-2 [&_button:hover]:underline',
        )}
        subNodes={subNodes}
        mainNode={
          <div
            data-active={item.isActive ? 'true' : undefined}
            className={twMerge(
              'flex min-h-11 min-w-0 items-stretch',
              item.isActive && 'bg-content-surface font-bold',
            )}
          >
            <button
              type="button"
              aria-current={
                item.isCurrent
                  ? 'page'
                  : item.isActive && (isCollapsed || (hasChildren && !expanded))
                    ? 'location'
                    : undefined
              }
              aria-label={isCollapsed ? itemLabel : undefined}
              title={isCollapsed ? itemLabel : undefined}
              onClick={() => navigate(item.path)}
              className={twMerge(
                'flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left text-sm underline-offset-2 hover:underline',
                depth === 0 ? 'px-5' : 'px-3',
                isCollapsed && 'justify-center px-0',
              )}
            >
              <NavigationIcon icon={item.icon} />
              {isCollapsed ? null : <span className="min-w-0 truncate">{itemLabel}</span>}
            </button>
            {hasChildren && !isCollapsed ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={toggleLabel}
                title={toggleLabel}
                onClick={() => setExpanded((current) => !current)}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-[var(--navigation-accent)]"
              >
                <PrimeIcon name={expanded ? 'chevron-down' : 'chevron-right'} />
              </button>
            ) : null}
          </div>
        }
      />
      {showsRecursiveChildren ? (
        <ul
          hidden={!expanded || isCollapsed}
          className="m-0 list-none space-y-0.5 py-0.5 pl-12 pr-2"
        >
          {item.children.map((child) => (
            <NavigationTreeRow
              key={child.id}
              item={child}
              expandedIds={expandedIds}
              isCollapsed={isCollapsed}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Generic resolved-tree renderer for contextual navigation. URL matching,
 * active ancestry and concrete paths are owned by `resolveNavigation`; this
 * component only adapts that model to IWA NavigationMenuItem disclosure UI.
 */
export function NavigationTree({
  items,
  expandedIds,
  isCollapsed,
}: {
  items: readonly ResolvedNavigationNode[];
  expandedIds: readonly string[];
  isCollapsed: boolean;
}) {
  return (
    <ul className="m-0 list-none space-y-0.5 p-0">
      {items.map((item) => (
        <NavigationTreeRow
          key={item.id}
          item={item}
          expandedIds={expandedIds}
          isCollapsed={isCollapsed}
          depth={0}
        />
      ))}
    </ul>
  );
}
