/**
 * Spring-style paginated list response, shared by every list endpoint.
 * `content` carries the rows; `page.number` is backend-facing and 0-based.
 */
export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
