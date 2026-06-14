// PUBLIC SDK ENTRY POINT

import { HttpClient } from '../core/http/httpClient';
import { createDebugMiddleware } from '../core/debug';
import { getEnv } from '../core/runtime/env';
import { MCPServersResource } from '../resources/mcp-servers';

import type { SynqedAIClientConfig } from './types';

export class SynqedAIClient {
  readonly apiKey?: string;

  readonly baseURL: string;

  readonly timeout: number;

  readonly debug: boolean;

  readonly dryRun: boolean;

  readonly http: HttpClient;

  readonly mcpServers: MCPServersResource;

  constructor(config: SynqedAIClientConfig = {}) {
    this.apiKey =
      config.apiKey ?? getEnv('SYNQEDAI_API_KEY');

    this.baseURL =
      config.baseURL ??
      getEnv('SYNQEDAI_BASE_URL') ??
      'https://synqedai.com/api/v1';

    this.timeout = config.timeout ?? 30_000;

    this.debug = config.debug ?? false;

    this.dryRun = config.dryRun ?? false;

    const middleware = [
      ...(config.middleware ?? []),
    ];

    if (this.debug) {
      middleware.push(createDebugMiddleware());
    }

    this.http = new HttpClient({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      debug: this.debug,
      dryRun: this.dryRun,
      middleware,
    });

    this.mcpServers = new MCPServersResource(
      this.http,
    );
  }
}