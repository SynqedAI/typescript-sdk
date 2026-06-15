import type { PaginationParams } from '@/core/pagination/types';

/** MCP server resource returned by the SynqedAI API. */
export interface MCPServer {
  id: string;
  name: string;
  transport: string;
  createdAt: string;
}

/** Request body for creating an MCP server. */
export interface CreateMCPServerRequest {
  name: string;
  transport: string;
}

/** Query parameters for listing MCP servers. */
export type ListMCPServersParams = PaginationParams;

export interface IterateMCPServersParams extends Omit<
  ListMCPServersParams,
  'page'
> {
  /** Page number to start iterating from. Defaults to `1`. */
  initialPage?: number;
  /** Maximum number of pages to fetch before aborting. */
  maxPages?: number;
}
