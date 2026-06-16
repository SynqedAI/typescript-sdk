import type { SynqedClientConfig } from '@/client/types';
import { HttpClient } from '@/core/http/http-client';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  ENV_API_KEY,
  ENV_BASE_URL,
  getEnv,
} from '@/core/runtime/env';
import { AuthConfigsEntity } from '@/entities/auth-configs/auth-configs';
import { ConnectionsEntity } from '@/entities/connections/connections';
import { GatewayInstancesEntity } from '@/entities/gateway-instances/gateway-instances';
import { GatewaysEntity } from '@/entities/gateways/gateways';
import { MCPServersEntity } from '@/entities/mcp-servers/mcp-servers';
import { SessionsEntity } from '@/entities/sessions/sessions';
import { TracesEntity } from '@/entities/traces/traces';

export class SynqedClient {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly debug: boolean;
  readonly authConfigs: AuthConfigsEntity;
  readonly connections: ConnectionsEntity;
  readonly gatewayInstances: GatewayInstancesEntity;
  readonly gateways: GatewaysEntity;
  readonly mcpServers: MCPServersEntity;
  readonly sessions: SessionsEntity;
  readonly traces: TracesEntity;
  private readonly http: HttpClient;

  constructor(config: SynqedClientConfig = {}) {
    this.apiKey = config.apiKey ?? getEnv(ENV_API_KEY);
    this.baseUrl = config.baseUrl ?? getEnv(ENV_BASE_URL) ?? DEFAULT_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.debug = config.debug ?? false;

    this.http = new HttpClient({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      timeoutMs: this.timeoutMs,
      debug: this.debug,
      retries: config.retries,
    });

    this.authConfigs = new AuthConfigsEntity(this.http, this.timeoutMs);
    this.connections = new ConnectionsEntity(this.http, this.timeoutMs);
    this.gatewayInstances = new GatewayInstancesEntity(this.http, this.timeoutMs);
    this.gateways = new GatewaysEntity(this.http, this.timeoutMs);
    this.mcpServers = new MCPServersEntity(this.http, this.timeoutMs);
    this.sessions = new SessionsEntity(this.http, this.timeoutMs);
    this.traces = new TracesEntity(this.http, this.timeoutMs);
  }
}

export default SynqedClient;
