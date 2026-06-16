import type { PaginationParams } from "@/core/pagination/types";

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

export interface MCPTool {
  name: string;
  title?: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

export interface MCPServerDetail {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  service_url?: string;
  auth_methods?: MCPServerAuthMethod[];
  tools?: MCPTool[];
}

export interface ListMCPServersParams extends PaginationParams {
  search?: string;
}

export interface ListMCPServerToolsParams extends PaginationParams {
  search?: string;
}
