import type { RequestOptions } from '@/core/http/request';
import { HttpClient } from '@/core/http/http-client';
import {
  collectPaginator,
  createPaginator,
  type PaginatedResponse,
} from '@/core/pagination';
import { buildQueryString } from '@/core/utils/build-query-string';
import type {
  CreateMCPServerRequest,
  IterateMCPServersParams,
  ListMCPServersParams,
  MCPServer,
} from '@/entities/mcp-servers/types';

/** @internal */
export class MCPServersEntity {
  constructor(
    private readonly http: HttpClient,
    private readonly defaultTimeoutMs: number,
  ) {}

  /**
   * Lists MCP servers for a single page.
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
      {
        timeoutMs: options.timeoutMs ?? this.defaultTimeoutMs,
        signal: options.signal,
      },
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
   */
  retrieve(id: string, options: RequestOptions = {}): Promise<MCPServer> {
    return this.http.request<MCPServer>(
      `/mcp-servers/${encodeURIComponent(id)}`,
      { method: 'GET' },
      options,
    );
  }

  /**
   * Creates a new MCP server.
   */
  create(
    body: CreateMCPServerRequest,
    options: RequestOptions = {},
  ): Promise<MCPServer> {
    return this.http.request<MCPServer>(
      '/mcp-servers',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      options,
    );
  }

  /**
   * Deletes an MCP server by ID.
   */
  delete(id: string, options: RequestOptions = {}): Promise<void> {
    return this.http.request<void>(
      `/mcp-servers/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      options,
    );
  }
}
