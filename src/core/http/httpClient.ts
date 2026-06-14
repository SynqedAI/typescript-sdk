import { buildHeaders } from './headers';
import { parseResponse } from './response';

import type { Middleware } from '../middleware/types';
import type { RequestOptions } from './request';

import { executeWithRetry } from '../resilience/execute-with-retry';
import { parseError } from '../errors/parse-error';

export class HttpClient {
  constructor(
    private readonly config: {
      apiKey?: string;
      baseURL: string;
      timeout?: number;
      debug?: boolean;
      dryRun?: boolean;
      middleware?: Middleware[];
    },
  ) {}

  async request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
    const middleware = this.config.middleware ?? [];

    const fullUrl = new URL(
      path,
      this.config.baseURL,
    ).toString();

    return executeWithRetry(
      async () => {
        const requestInit: RequestInit = {
          ...init,
          signal: options.signal,
          headers: {
            ...buildHeaders(
              this.config.apiKey,
              options.idempotencyKey,
            ),
            ...init.headers,
          },
        };

        const requestContext = {
          url: fullUrl,
          init: requestInit,
        };

        for (const item of middleware) {
          await item.onRequest?.(requestContext);
        }

        if (this.config.dryRun) {
          return {
            dryRun: true,
            url: fullUrl,
            init: requestInit,
          } as T;
        }

        try {
          const response = await fetch(
            fullUrl,
            requestInit,
          );

          for (const item of middleware) {
            await item.onResponse?.(response);
          }

          if (!response.ok) {
            throw await parseError(response);
          }

          return parseResponse<T>(response);
        } catch (error) {
          for (const item of middleware) {
            await item.onError?.(error);
          }

          throw error;
        }
      },
      {
        method: init.method,
        hasIdempotencyKey: Boolean(
          options.idempotencyKey,
        ),
      },
    );
  }
}