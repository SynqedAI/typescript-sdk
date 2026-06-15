import type { PaginatedResponse } from '@/core/pagination/types';

export interface CreatePaginatorOptions<T> {
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>;
  initialPage?: number;
  maxPages?: number;
}

/** @internal */
export async function* createPaginator<T>({
  fetchPage,
  initialPage = 1,
  maxPages = 10_000,
}: CreatePaginatorOptions<T>): AsyncGenerator<T> {
  let page: number | null = initialPage;
  const seenPages = new Set<number>();

  while (page !== null) {
    if (seenPages.has(page)) {
      throw new Error(`Pagination loop detected at page ${page}`);
    }

    if (seenPages.size >= maxPages) {
      throw new Error(`Pagination exceeded max page limit of ${maxPages}`);
    }

    seenPages.add(page);

    const response = await fetchPage(page);

    for (const item of response.data) {
      yield item;
    }

    // List responses nest pagination metadata under `pagination`, not at the top level.
    page = response.pagination.next_page;
  }
}
