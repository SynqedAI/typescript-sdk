import type { PaginationParams } from '@/core/pagination/types';

/** MCP server resource returned by the SynqedAI API. */
export interface MCPServer {
  id: string;
  name: string;
  transport?: string;
  created_at?: string;
}

/** MCP tool exposed by an MCP server. */
export interface MCPTool {
  name: string;
  description?: string | null;
  input_schema?: Record<string, unknown>;
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
