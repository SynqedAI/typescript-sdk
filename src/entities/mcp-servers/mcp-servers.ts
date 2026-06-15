import type { RequestOptions } from '@/core/http/request';
import { HttpClient } from '@/core/http/http-client';
import type { ApiResponse } from '@/core/pagination/types';
import {
  collectPaginator,
  createPaginator,
  type PaginatedResponse,
} from '@/core/pagination';
import { buildQueryString } from '@/core/utils/build-query-string';
import type {
  IterateMCPServersParams,
  ListMCPServersParams,
  MCPServer,
  MCPTool,
} from '@/entities/mcp-servers/types';
import type { PaginationParams } from '@/core/pagination/types';

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
    });

    return this.http.request<PaginatedResponse<MCPServer>>(
      `/mcp-servers${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }

  /**
   * Lazily iterates MCP servers across all pages.
   */
  iterate(params: IterateMCPServersParams = {}): AsyncGenerator<MCPServer> {
    const { initialPage = 1, maxPages, ...listParams } = params;

    return createPaginator({
      fetchPage: (page) => this.list({ ...listParams, page }),
      initialPage,
      maxPages,
    });
  }

  /**
   * Fetches all MCP servers across every page.
   */
  listAll(params: IterateMCPServersParams = {}): Promise<MCPServer[]> {
    return collectPaginator(this.iterate(params));
  }

  /**
   * Retrieves a single MCP server by ID.
   * Unwraps {@link ApiResponse} and returns the inner resource.
   */
  async retrieve(id: string, options: RequestOptions = {}): Promise<MCPServer> {
    const response = await this.http.request<ApiResponse<MCPServer>>(
      `/mcp-servers/${encodeURIComponent(id)}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );

    return response.data;
  }

  /**
   * Lists tools exposed by an MCP server.
   * Returns the full {@link PaginatedResponse} (`{ data, pagination }`).
   */
  listTools(
    id: string,
    params: PaginationParams = {},
    options: RequestOptions = {},
  ): Promise<PaginatedResponse<MCPTool>> {
    const query = buildQueryString({
      page: params.page,
      page_size: params.page_size,
    });

    return this.http.request<PaginatedResponse<MCPTool>>(
      `/mcp-servers/${encodeURIComponent(id)}/tools${query}`,
      { method: 'GET' },
      this.resolveOptions(options),
    );
  }
}
