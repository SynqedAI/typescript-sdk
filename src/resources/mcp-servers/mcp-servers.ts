import type { HttpClient } from '../../core/http/httpClient';

import { createPaginator } from '../../core/pagination';

import type { PaginatedResponse } from '../../core/pagination';

import { removeUndefined } from '../../core/utils';

import type {
  MCPServer,
  CreateMCPServerRequest,
  ListMCPServersParams,
} from './types';

/**
 * MCP Servers resource.
 */
export class MCPServersResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lists MCP servers.
   */
  list(params: ListMCPServersParams = {}) {
    const searchParams = new URLSearchParams(
      removeUndefined({
        limit: params.limit?.toString(),
        cursor: params.cursor,
      }) as Record<string, string>,
    );

    const query = searchParams.toString();

    return this.http.request<PaginatedResponse<MCPServer>>(
      `/mcp-servers${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      },
    );
  }

  /**
   * Async iterator over all MCP servers.
   */
  listAll() {
    return createPaginator((cursor) =>
      this.list({
        cursor,
      }),
    );
  }

  /**
   * Retrieves a single MCP server.
   */
  retrieve(id: string) {
    return this.http.request<MCPServer>(`/mcp-servers/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Creates an MCP server.
   */
  create(body: CreateMCPServerRequest) {
    return this.http.request<MCPServer>('/mcp-servers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Deletes an MCP server.
   */
  delete(id: string) {
    return this.http.request<void>(`/mcp-servers/${id}`, {
      method: 'DELETE',
    });
  }
}