//Standardizes ALL paginated responses across SDK.

export interface PageInfo {
  hasMore: boolean;

  nextCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];

  pageInfo: PageInfo;
}
