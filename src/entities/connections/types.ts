import type { PaginationParams } from "@/core/pagination/types";

export type ConnectionStatus =
  | "initiated"
  | "connected"
  | "expired"
  | "revoked";

export interface Connection {
  id: string;
  name: string;
  connection_status: ConnectionStatus | string;
  server_name: string;
  server_slug: string;
  redirect_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InitiateConnectionRequest {
  server_slug: string;
  auth_config_id?: string;
  name?: string;
  scopes?: string[];
}

export interface ListConnectionsParams extends PaginationParams {
  server_slug?: string;
  status?: ConnectionStatus;
}
