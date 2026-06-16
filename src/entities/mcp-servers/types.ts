import type { PaginationParams } from '@/core/pagination/types';

/** MCP server item returned by list endpoints. */
export interface MCPServer {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  total_tools?: number;
}

export interface MCPServerScope {
  scope_key: string;
  description?: string;
  is_required?: boolean;
}

export interface MCPServerAuthMethod {
  name: string;
  type: string;
  scopes?: MCPServerScope[];
}

/** MCP tool exposed by an MCP server. */
export interface MCPTool {
  name: string;
  title?: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

/** Full MCP server details including auth methods and tools. */
export interface MCPServerDetail {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  service_url?: string;
  auth_methods?: MCPServerAuthMethod[];
  tools?: MCPTool[];
}

/** Query parameters for listing MCP servers. */
export interface ListMCPServersParams extends PaginationParams {
  /** Search servers by name or description. */
  search?: string;
}

/** Query parameters for listing MCP server tools. */
export interface ListMCPServerToolsParams extends PaginationParams {
  /** Search tools by name or description. */
  search?: string;
}
