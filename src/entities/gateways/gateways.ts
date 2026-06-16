import type { RequestOptions } from '@/core/http/request';
import { HttpClient } from '@/core/http/http-client';
import type { ApiResponse } from '@/core/pagination/types';
import type { PaginatedResponse } from '@/core/pagination';
import { buildQueryString } from '@/core/utils/build-query-string';
import type {
  AddGatewayServerRequest,
  AddGatewayToolsRequest,
  AddGatewayToolsResponse,
  CreateGatewayRequest,
  Gateway,
  GatewayServer,
  GatewayTool,
  ListGatewayServersParams,
  ListGatewaysParams,
  ListGatewayToolsParams,
  RemoveGatewayToolsRequest,
  RemoveGatewayToolsResponse,
  UpdateGatewayRequest,
} from '@/entities/gateways/types';

/** @internal */
export class GatewaysEntity {
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

  private gatewayPath(id: string): string {
    return `/gateways/${encodeURIComponent(id)}`;
  }

  /**
   * Lists gateways for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  list(
    params: ListGatewaysParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<Gateway>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      status: params.status,
    });

    return this.http.request<PaginatedResponse<Gateway>>(
      `/gateways${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all gateways across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listAll(
    params: Omit<ListGatewaysParams, 'page'> = {},
    options: RequestOptions = {},
  ): Promise<Gateway[]> {
    const items: Gateway[] = [];
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
   * Creates a new gateway.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async create(
    body: CreateGatewayRequest,
    options: RequestOptions = {},
  ): Promise<Gateway> {
    const response = await this.http.request<ApiResponse<Gateway>>(
      '/gateways',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Returns a single gateway by ID.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async getById(id: string, options: RequestOptions = {}): Promise<Gateway> {
    const response = await this.http.request<ApiResponse<Gateway>>(
      this.gatewayPath(id),
      { method: 'GET' },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Updates gateway fields. Exposure mode is immutable.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async update(
    id: string,
    body: UpdateGatewayRequest,
    options: RequestOptions = {},
  ): Promise<Gateway> {
    const response = await this.http.request<ApiResponse<Gateway>>(
      this.gatewayPath(id),
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Deletes a gateway and all its associated resources.
   */
  delete(id: string, options: RequestOptions = {}): Promise<void> {
    return this.http.request<void>(
      this.gatewayPath(id),
      { method: 'DELETE' },
      this.resolveOptions(options),
    );
  }

  /**
   * Lists servers attached to a gateway for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  listServers(
    gatewayId: string,
    params: ListGatewayServersParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<GatewayServer>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
    });

    return this.http.request<PaginatedResponse<GatewayServer>>(
      `${this.gatewayPath(gatewayId)}/servers${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all servers attached to a gateway across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listServersAll(
    gatewayId: string,
    params: Omit<ListGatewayServersParams, 'page'> = {},
    options: RequestOptions = {},
  ): Promise<GatewayServer[]> {
    const items: GatewayServer[] = [];
    let page = 1;

    while (true) {
      const response = await this.listServers(
        gatewayId,
        { ...params, page },
        options,
      );
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
   * Attaches a server to a gateway.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async addServer(
    gatewayId: string,
    body: AddGatewayServerRequest,
    options: RequestOptions = {},
  ): Promise<GatewayServer> {
    const response = await this.http.request<ApiResponse<GatewayServer>>(
      `${this.gatewayPath(gatewayId)}/servers`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Detaches a server and all its tool selections from a gateway.
   */
  removeServer(
    gatewayId: string,
    serverSlug: string,
    options: RequestOptions = {},
  ): Promise<void> {
    return this.http.request<void>(
      `${this.gatewayPath(gatewayId)}/servers/${encodeURIComponent(serverSlug)}`,
      { method: 'DELETE' },
      this.resolveOptions(options),
    );
  }

  /**
   * Lists tools exposed through a gateway for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  listTools(
    gatewayId: string,
    params: ListGatewayToolsParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<GatewayTool>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      server_slug: params.server_slug,
      search: params.search,
    });

    return this.http.request<PaginatedResponse<GatewayTool>>(
      `${this.gatewayPath(gatewayId)}/tools${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all tools exposed through a gateway across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listToolsAll(
    gatewayId: string,
    params: Omit<ListGatewayToolsParams, 'page'> = {},
    options: RequestOptions = {},
  ): Promise<GatewayTool[]> {
    const items: GatewayTool[] = [];
    let page = 1;

    while (true) {
      const response = await this.listTools(
        gatewayId,
        { ...params, page },
        options,
      );
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
   * Adds specific tools for a server. Only applicable in custom mode.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async addTools(
    gatewayId: string,
    body: AddGatewayToolsRequest,
    options: RequestOptions = {},
  ): Promise<AddGatewayToolsResponse> {
    const response = await this.http.request<
      ApiResponse<AddGatewayToolsResponse>
    >(
      `${this.gatewayPath(gatewayId)}/tools`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Removes specific tools for a server. Only applicable in custom mode.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async removeTools(
    gatewayId: string,
    body: RemoveGatewayToolsRequest,
    options: RequestOptions = {},
  ): Promise<RemoveGatewayToolsResponse> {
    const response = await this.http.request<
      ApiResponse<RemoveGatewayToolsResponse>
    >(
      `${this.gatewayPath(gatewayId)}/tools`,
      {
        method: 'DELETE',
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }
}
