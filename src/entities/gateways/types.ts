import type { PaginationParams } from "@/core/pagination/types";

export type GatewayExposureMode = "dynamic" | "custom";
export type GatewayStatus = "enabled" | "draft" | "disabled";

export interface Gateway {
  id: string;
  name: string;
  slug: string;
  description?: string;
  exposure_mode: GatewayExposureMode | string;
  gateway_status?: string;
  status: GatewayStatus | string;
  include_all_servers: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolAnnotationPolicy {
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  readOnlyHint?: boolean;
}

export interface GatewayServerInput {
  server_slug: string;
  auth_config_id?: string;
}

export interface GatewayToolInput {
  server_slug: string;
  tool_name: string;
}

export interface CreateGatewayRequest {
  name: string;
  exposure_mode: GatewayExposureMode;
  description?: string;
  include_all_servers?: boolean;
  servers?: GatewayServerInput[];
  tools?: GatewayToolInput[];
  tool_annotation_policy?: ToolAnnotationPolicy;
}

export interface UpdateGatewayRequest {
  name?: string;
  description?: string;
  include_all_servers?: boolean;
  tool_annotation_policy?: ToolAnnotationPolicy;
}

export interface ListGatewaysParams extends PaginationParams {
  status?: GatewayStatus;
}

export interface GatewayServerAuthConfig {
  id: string;
  name: string;
  auth_method_type: string;
  status: string;
}

export interface GatewayServer {
  server_slug: string;
  server_name: string;
  description?: string;
  logo_url?: string;
  connection_status: string;
  active_tool_count: number;
  total_tool_count: number;
  auth_config?: GatewayServerAuthConfig;
  created_at: string;
}

export interface ListGatewayServersParams extends PaginationParams {}

export interface AddGatewayServerRequest {
  server_slug: string;
  auth_config_id?: string;
}

export interface GatewayTool {
  name: string;
  title?: string;
  description?: string;
  server_slug: string;
  server_name: string;
  enabled: boolean;
  annotations?: ToolAnnotationPolicy;
  input_schema?: unknown;
  output_schema?: unknown;
}

export interface ListGatewayToolsParams extends PaginationParams {
  server_slug?: string;
  search?: string;
}

export interface AddGatewayToolsRequest {
  server_slug: string;
  tools: string[];
}

export interface AddGatewayToolsResponse {
  server_slug: string;
  added: string[];
  active_tool_count: number;
  total_tool_count: number;
}

export interface RemoveGatewayToolsRequest {
  server_slug: string;
  tools: string[];
}

export interface RemoveGatewayToolsResponse {
  server_slug: string;
  removed: string[];
  active_tool_count: number;
  total_tool_count: number;
}
