/**
 * Optional pagination query parameters.
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * Pagination metadata returned by list endpoints.
 */
export interface PageInfo {
  current_page: number;
  next_page: number | null;
  page_size: number;
  prev_page: number | null;
  total_pages: number;
  total_records: number;
}

/**
 * Paginated list response from the SynqedAI API.
 */
export interface PaginatedResponse<T> extends PageInfo {
  data: T[];
}
