export interface Item {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  value: number;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

export interface ItemsPage {
  rows: Item[];
  /** Total number of rows matching the query, across all pages. */
  total: number;
}
