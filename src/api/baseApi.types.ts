export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/**
 * Export request shape for the backend. The `locale` is used to localize the
 * column headers; the `columnSelection` is a list of the backend's property
 * names to include in the export.
 */
export interface ExportRequest {
  locale: string;
  columnSelection?: string[];
}
