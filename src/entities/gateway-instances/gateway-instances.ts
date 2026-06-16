import type { RequestOptions } from "@/core/http/request";
import { HttpClient } from "@/core/http/http-client";
import type { ApiResponse } from "@/core/pagination/types";
import type { PaginatedResponse } from "@/core/pagination";
import { buildQueryString } from "@/core/utils/build-query-string";
import type {
  ConnectionLink,
  CreateConnectionLinkRequest,
  CreateGatewayInstanceRequest,
  GatewayInstance,
  GatewayInstanceConnectResponse,
  GatewayInstanceConnection,
  ListGatewayInstanceConnectionsParams,
  ListGatewayInstancesParams,
} from "@/entities/gateway-instances/types";

/** @internal */
export class GatewayInstancesEntity {
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

  private instancesPath(gatewayId: string): string {
    return `/gateways/${encodeURIComponent(gatewayId)}/instances`;
  }

  private instancePath(gatewayId: string, instanceId: string): string {
    return `${this.instancesPath(gatewayId)}/${encodeURIComponent(instanceId)}`;
  }

  /**
   * Lists gateway instances for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  list(
    gatewayId: string,
    params: ListGatewayInstancesParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<GatewayInstance>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      user_id: params.user_id,
    });

    return this.http.request<PaginatedResponse<GatewayInstance>>(
      `${this.instancesPath(gatewayId)}${query}`,
      { method: "GET" },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all gateway instances across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listAll(
    gatewayId: string,
    params: Omit<ListGatewayInstancesParams, "page"> = {},
    options: RequestOptions = {},
  ): Promise<GatewayInstance[]> {
    const items: GatewayInstance[] = [];
    let page = 1;

    while (true) {
      const response = await this.list(gatewayId, { ...params, page }, options);
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
   * Creates a new per-user instance under a gateway.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async create(
    gatewayId: string,
    body: CreateGatewayInstanceRequest,
    options: RequestOptions = {},
  ): Promise<GatewayInstance> {
    const response = await this.http.request<ApiResponse<GatewayInstance>>(
      this.instancesPath(gatewayId),
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Returns the MCP endpoint URL for connecting a client to an instance.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async connect(
    gatewayId: string,
    instanceId: string,
    options: RequestOptions = {},
  ): Promise<GatewayInstanceConnectResponse> {
    const response = await this.http.request<
      ApiResponse<GatewayInstanceConnectResponse>
    >(
      `${this.instancePath(gatewayId, instanceId)}/connect`,
      { method: "POST" },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Lists per-server connection status for a gateway instance.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  listConnections(
    gatewayId: string,
    instanceId: string,
    params: ListGatewayInstanceConnectionsParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<GatewayInstanceConnection>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      status: params.status,
    });

    return this.http.request<PaginatedResponse<GatewayInstanceConnection>>(
      `${this.instancePath(gatewayId, instanceId)}/connections${query}`,
      { method: "GET" },
      this.resolveOptions(options),
    );
  }

  /**
   * Generates an OAuth redirect URL for a specific server on an instance.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async createConnectionLink(
    gatewayId: string,
    instanceId: string,
    body: CreateConnectionLinkRequest,
    options: RequestOptions = {},
  ): Promise<ConnectionLink> {
    const response = await this.http.request<ApiResponse<ConnectionLink>>(
      `${this.instancePath(gatewayId, instanceId)}/connections`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      this.resolveOptions(options),
    );

    return response.data;
  }
}
