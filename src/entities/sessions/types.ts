export type GatewayExposureMode = 'dynamic' | 'custom';

export interface CreateSessionRequest {
  user_id: string;
  gateway: {
    name?: string;
    gateway_id?: string;
    exposure_mode?: GatewayExposureMode;
    include_all_servers?: boolean;
  };
}

export interface Session {
  id: string;
  user_id: string;
  gateway_id: string;
  status: string;
  mcp: {
    url: string;
    headers: Record<string, string>;
  };
  connections: SessionConnection[];
  created_at: string;
}

export interface SessionConnection {
  server_slug: string;
  server_name: string;
  connection_status:
    | 'connected'
    | 'not_connected'
    | 'initiated'
    | 'expired'
    | 'revoked'
    | string;
  redirect_url?: string;
}
