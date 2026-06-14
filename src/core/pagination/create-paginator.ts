// Why Async Generator?

// Allows streaming-style iteration.

// Very scalable for:

// large datasets
// low memory usage
// enterprise APIs


import type {
    PaginatedResponse,
  } from './types';
  
  export async function* createPaginator<T>(
    fetchPage: (
      cursor?: string,
    ) => Promise<
      PaginatedResponse<T>
    >,
  ) {
    let cursor:
      string | undefined;
  
    while (true) {
      const page =
        await fetchPage(cursor);
  
      for (const item of page.data) {
        yield item;
      }
  
      if (
        !page.pageInfo.hasMore
      ) {
        break;
      }
  
      cursor =
        page.pageInfo.nextCursor;
    }
  }