import type { RequestOptions } from '@/core/http/request';
import { HttpClient } from '@/core/http/http-client';
import type { ApiResponse } from '@/core/pagination/types';
import type { PaginatedResponse } from '@/core/pagination';
import { buildQueryString } from '@/core/utils/build-query-string';
import type { ListTracesParams, Trace } from '@/entities/traces/types';

/** @internal */
export class TracesEntity {
  constructor(
    private readonly http: HttpClient,
    private readonly defaultTimeoutMs: number,
  ) {}

  private resolveOptions(options: RequestOptions = {}): RequestOptions {
    return {
      ...options,
      timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
    };
  }

  /**
   * Lists trace events for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  list(
    params: ListTracesParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<Trace>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      gateway_id: params.gateway_id,
      instance_id: params.instance_id,
      session_id: params.session_id,
      server_slug: params.server_slug,
      methods: params.methods,
      search: params.search,
      from: params.from,
      to: params.to,
    });

    return this.http.request<PaginatedResponse<Trace>>(
      `/traces${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all trace events across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listAll(
    params: Omit<ListTracesParams, 'page'> = {},
    options: RequestOptions = {},
  ): Promise<Trace[]> {
    const items: Trace[] = [];
    let page = 1;

    while (true) {
      const response = await this.list({ ...params, page }, options);
      items.push(...response.data);

      const nextPage = response.pagination.next_page;
      if (nextPage === null || nextPage === undefined) {
        break;
      }

      page = nextPage;
    }

    return items;
  }

  /**
   * Returns a single trace event by ID.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async getById(id: string, options: RequestOptions = {}): Promise<Trace> {
    const response = await this.http.request<ApiResponse<Trace>>(
      `/traces/${encodeURIComponent(id)}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );

    return response.data;
  }
}
