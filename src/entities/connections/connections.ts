import type { RequestOptions } from "@/core/http/request";
import { HttpClient } from "@/core/http/http-client";
import type { ApiResponse } from "@/core/pagination/types";
import type { PaginatedResponse } from "@/core/pagination";
import { buildQueryString } from "@/core/utils/build-query-string";
import type {
  Connection,
  InitiateConnectionRequest,
  ListConnectionsParams,
} from "@/entities/connections/types";

/** @internal */
export class ConnectionsEntity {
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
   * Lists connections for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  list(
    params: ListConnectionsParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<Connection>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      server_slug: params.server_slug,
      status: params.status,
    });

    return this.http.request<PaginatedResponse<Connection>>(
      `/connections${query}`,
      { method: "GET" },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all connections across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listAll(
    params: Omit<ListConnectionsParams, "page"> = {},
    options: RequestOptions = {},
  ): Promise<Connection[]> {
    const items: Connection[] = [];
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
   * Initiates a new connection to an MCP server.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async initiate(
    body: InitiateConnectionRequest,
    options: RequestOptions = {},
  ): Promise<Connection> {
    const response = await this.http.request<ApiResponse<Connection>>(
      "/connections",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Returns a single connection by ID.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async getById(id: string, options: RequestOptions = {}): Promise<Connection> {
    const response = await this.http.request<ApiResponse<Connection>>(
      `/connections/${encodeURIComponent(id)}`,
      { method: "GET" },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Revokes and deletes a connection by ID.
   */
  delete(id: string, options: RequestOptions = {}): Promise<void> {
    return this.http.request<void>(
      `/connections/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      this.resolveOptions(options),
    );
  }
}
