import type { RequestOptions } from '@/core/http/request';
import { HttpClient } from '@/core/http/http-client';
import type { ApiResponse } from '@/core/pagination/types';
import type { PaginatedResponse } from '@/core/pagination';
import { buildQueryString } from '@/core/utils/build-query-string';
import type {
  AuthConfig,
  AuthConfigListItem,
  CreateAuthConfigRequest,
  ListAuthConfigsParams,
  UpdateAuthConfigRequest,
} from '@/entities/auth-configs/types';

/** @internal */
export class AuthConfigsEntity {
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
   * Lists auth configs for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  list(
    params: ListAuthConfigsParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<AuthConfigListItem>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      server_slug: params.server_slug,
      status: params.status,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    });

    return this.http.request<PaginatedResponse<AuthConfigListItem>>(
      `/auth-configs${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all auth configs across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listAll(
    params: Omit<ListAuthConfigsParams, 'page'> = {},
    options: RequestOptions = {},
  ): Promise<AuthConfigListItem[]> {
    const items: AuthConfigListItem[] = [];
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
   * Creates a new auth config.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async create(
    body: CreateAuthConfigRequest,
    options: RequestOptions = {},
  ): Promise<AuthConfig> {
    const response = await this.http.request<ApiResponse<AuthConfig>>(
      '/auth-configs',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Returns a single auth config by ID.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async getById(id: string, options: RequestOptions = {}): Promise<AuthConfig> {
    const response = await this.http.request<ApiResponse<AuthConfig>>(
      `/auth-configs/${encodeURIComponent(id)}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Updates an auth config's name and/or OAuth override credentials.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async update(
    id: string,
    body: UpdateAuthConfigRequest,
    options: RequestOptions = {},
  ): Promise<AuthConfig> {
    const response = await this.http.request<ApiResponse<AuthConfig>>(
      `/auth-configs/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Deletes an auth config by ID.
   */
  delete(id: string, options: RequestOptions = {}): Promise<void> {
    return this.http.request<void>(
      `/auth-configs/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      this.resolveOptions(options),
    );
  }
}
