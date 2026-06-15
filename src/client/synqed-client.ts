import type { SynqedClientConfig } from "@/client/types";
import { HttpClient } from "@/core/http/http-client";
import {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  ENV_API_KEY,
  ENV_BASE_URL,
  getEnv,
} from "@/core/runtime/env";
import { MCPServersEntity } from "@/entities/mcp-servers/mcp-servers";


export class SynqedClient {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly debug: boolean;
  readonly mcpServers: MCPServersEntity;
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

    this.mcpServers = new MCPServersEntity(this.http, this.timeoutMs);
  }
}

export default SynqedClient;
