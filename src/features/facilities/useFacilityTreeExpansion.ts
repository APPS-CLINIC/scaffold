import { useEffect, useRef, useState } from 'react';
import { getExpandableTreeKeys } from '@/ui';
import {
  DEEPEST_FACILITY_LEVEL,
  TOP_FACILITY_LEVEL,
  allFacilityNodes,
  facilityChildrenComplete,
  facilityNodeChildren,
  facilityNodeHasChildren,
  facilityNodeKey,
} from './facilities.types';
import type { FacilityLevel, FacilityNode } from './facilities.types';

export interface FacilityTreeExpansionOptions {
  /** Expansion and the chosen level belong to one query; a new key starts from the top. */
  queryKey: string;
  nodes: readonly FacilityNode[];
  /** Branches opened for a new query, e.g. the path to a search match. */
  autoExpandedKeys: readonly string[];
  /**
   * Lazy owners load the pages needed to open every branch above `level` and return the keys
   * to expand. Without it, only branches that are already loaded open.
   */
  onExpandToLevel?: (level: FacilityLevel, signal: AbortSignal) => Promise<readonly string[]>;
}

/**
 * Which branches are open and which facility level the tree was opened to. Opening a level
 * can load pages through `onExpandToLevel`; a newer choice, a cancel or a new query aborts the
 * one in flight, and a cancelled or failed load restores the previous level.
 */
export function useFacilityTreeExpansion({
  queryKey,
  nodes,
  autoExpandedKeys,
  onExpandToLevel,
}: FacilityTreeExpansionOptions) {
  const [expansion, setExpansion] = useState<{ queryKey: string; keys: readonly string[] } | null>(
    null,
  );
  const expandedKeys = expansion?.queryKey === queryKey ? expansion.keys : autoExpandedKeys;
  const setExpandedKeys = (keys: readonly string[]) => setExpansion({ queryKey, keys });
  const branchKeys = getExpandableTreeKeys(
    nodes,
    facilityNodeKey,
    facilityNodeChildren,
    facilityNodeHasChildren,
  );
  const allExpanded =
    branchKeys.length > 0 &&
    branchKeys.every((key) => expandedKeys.includes(key)) &&
    !allFacilityNodes(nodes).some((node) => node.hasChildren && !facilityChildrenComplete(node));

  // The level records the last level the tree was opened to. Manual toggles do not change it,
  // and a new query starts again from the top level like its expansion does.
  const [openLevel, setOpenLevel] = useState<{ queryKey: string; level: FacilityLevel } | null>(
    null,
  );
  const selectedLevel = openLevel?.queryKey === queryKey ? openLevel.level : TOP_FACILITY_LEVEL;
  const [expandingTo, setExpandingTo] = useState<FacilityLevel | null>(null);
  const expansionRequest = useRef(0);
  const expansionController = useRef<AbortController | null>(null);
  const levelBeforeExpanding = useRef<FacilityLevel>(TOP_FACILITY_LEVEL);
  const latestQueryKey = useRef(queryKey);
  latestQueryKey.current = queryKey;
  useEffect(() => {
    setExpandingTo(null);
    return () => {
      expansionController.current?.abort();
    };
  }, [queryKey]);

  const cancelExpanding = () => {
    expansionController.current?.abort();
    expansionRequest.current++;
    setExpandingTo(null);
    setOpenLevel({ queryKey, level: levelBeforeExpanding.current });
  };

  const openToLevel = async (level: FacilityLevel) => {
    const request = ++expansionRequest.current;
    expansionController.current?.abort();
    const forQuery = queryKey;
    // While another level is still loading, the last fully opened level stays the fallback.
    if (expandingTo === null) levelBeforeExpanding.current = selectedLevel;
    setOpenLevel({ queryKey: forQuery, level });
    if (level === TOP_FACILITY_LEVEL || !onExpandToLevel) {
      setExpandingTo(null);
      setExpandedKeys(
        level === DEEPEST_FACILITY_LEVEL
          ? branchKeys
          : allFacilityNodes(nodes)
              .filter((node) => node.hasChildren && node.businessLevel < level)
              .map((node) => node.key),
      );
      return;
    }
    const controller = new AbortController();
    expansionController.current = controller;
    setExpandingTo(level);
    try {
      const next = await onExpandToLevel(level, controller.signal);
      if (
        !controller.signal.aborted &&
        request === expansionRequest.current &&
        forQuery === latestQueryKey.current
      )
        setExpansion({ queryKey: forQuery, keys: next });
    } catch {
      // A failed branch exposes its retry control; the level returns to the previous choice.
      if (request === expansionRequest.current)
        setOpenLevel({ queryKey: forQuery, level: levelBeforeExpanding.current });
    } finally {
      if (!controller.signal.aborted && request === expansionRequest.current) setExpandingTo(null);
    }
  };

  /** "Expand all" is the deepest level; collapsing returns to the top one. */
  const setAllExpanded = (expanded: boolean) => {
    if (expandingTo === null)
      void openToLevel(expanded ? DEEPEST_FACILITY_LEVEL : TOP_FACILITY_LEVEL);
  };

  return {
    expandedKeys,
    setExpandedKeys,
    branchKeys,
    allExpanded,
    selectedLevel,
    expandingTo,
    openToLevel,
    setAllExpanded,
    cancelExpanding,
  };
}
