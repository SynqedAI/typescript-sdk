import type { PaginationParams } from "@/core/pagination/types";

export interface GatewayInstance {
  id: string;
  gateway_id: string;
  user_id: string;
  name: string;
  slug: string;
  status: string;
  instance_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGatewayInstanceRequest {
  user_id: string;
  name?: string;
}

export interface MCPEndpoint {
  url: string;
  headers: Record<string, string>;
}

export interface GatewayInstanceConnectResponse {
  mcp: MCPEndpoint;
}

export type InstanceConnectionStatus =
  | "not_connected"
  | "initiated"
  | "connected"
  | "expired"
  | "revoked";

export interface GatewayInstanceConnection {
  connection_id?: string;
  connection_status: InstanceConnectionStatus | string;
  server_name: string;
  server_slug: string;
  logo_url?: string;
  created_at?: string;
}

export interface CreateConnectionLinkRequest {
  server_slug: string;
  scopes?: string[];
}

export interface ConnectionLink {
  connection_id: string;
  connection_status: string;
  redirect_url: string;
  server_name: string;
  server_slug: string;
  created_at: string;
}

export interface ListGatewayInstancesParams extends PaginationParams {
  user_id?: string;
}

export interface ListGatewayInstanceConnectionsParams extends PaginationParams {
  status?: InstanceConnectionStatus;
}
