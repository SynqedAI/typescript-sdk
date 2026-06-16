import type { PaginationParams } from "@/core/pagination/types";

export interface Trace {
  id: string;
  user_id: string;
  gateway_id: string;
  gateway_name: string;
  instance_id: string;
  instance_name: string;
  session_id: string;
  server_name: string;
  server_slug: string;
  rpc_method: string;
  entity_name: string;
  duration_ms: number;
  upstream_duration_ms: number;
  error?: string;
  timestamp: string;
  created_at: string;
}

export interface ListTracesParams extends PaginationParams {
  gateway_id?: string;
  instance_id?: string;
  session_id?: string;
  server_slug?: string;
  methods?: string;
  search?: string;
  from?: string;
  to?: string;
}
