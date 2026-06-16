import type { RequestOptions } from "@/core/http/request";
import { HttpClient } from "@/core/http/http-client";
import type { ApiResponse } from "@/core/pagination/types";
import type { PaginatedResponse } from "@/core/pagination";
import { buildQueryString } from "@/core/utils/build-query-string";
import type {
  ListMCPServersParams,
  ListMCPServerToolsParams,
  MCPServer,
  MCPServerDetail,
  MCPTool,
} from "@/entities/mcp-servers/types";

/** @internal */
export class MCPServersEntity {
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
   * Lists MCP servers for a single page.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  list(
    params: ListMCPServersParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<MCPServer>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      search: params.search,
    });

    return this.http.request<PaginatedResponse<MCPServer>>(
      `/mcp-servers${query}`,
      { method: "GET" },
      this.resolveOptions(options),
    );
  }

  /**
   * Fetches all MCP servers across every page.
   * SDK convenience helper — follows `pagination.next_page` internally.
   */
  async listAll(
    params: Omit<ListMCPServersParams, "page"> = {},
    options: RequestOptions = {},
  ): Promise<MCPServer[]> {
    const items: MCPServer[] = [];
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
   * Returns full details for a single MCP server by slug.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async getBySlug(
    slug: string,
    options: RequestOptions = {},
  ): Promise<MCPServerDetail> {
    const response = await this.http.request<ApiResponse<MCPServerDetail>>(
      `/mcp-servers/${encodeURIComponent(slug)}`,
      { method: "GET" },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Lists tools exposed by an MCP server.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  listTools(
    slug: string,
    params: ListMCPServerToolsParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<MCPTool>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      search: params.search,
    });

    return this.http.request<PaginatedResponse<MCPTool>>(
      `/mcp-servers/${encodeURIComponent(slug)}/tools${query}`,
      { method: "GET" },
      this.resolveOptions(options),
    );
  }
}
