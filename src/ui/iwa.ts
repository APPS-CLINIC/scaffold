/**
 * Single import seam for the private IWA component library. Everything the
 * app consumes from `iwa-react-components` is re-exported here, so an
 * upstream change (export path, rename, replacement) is a one-file fix and
 * feature code never depends on the vendor package directly.
 */
export {
  ActionLink,
  Card,
  DefinitionList,
  InlineLink,
  MenuList,
  NavigationPanel,
  PaginatorTable,
  ScreenHeading,
  SkeletonTable,
  Status,
  Switch,
  TabMenu,
  TopBar,
  twMerge,
} from 'iwa-react-components';
export type {
  ActionLinkProps,
  CardProps,
  DefinitionListProps,
  InlineLinkProps,
  PaginatorTableProps,
  ScreenHeadingProps,
  SkeletonTableColumn,
  SkeletonTableProps,
  StatusProps,
  StatusType,
  SwitchProps,
  TableProps,
} from 'iwa-react-components';
