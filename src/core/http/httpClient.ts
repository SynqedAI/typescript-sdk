import { buildHeaders } from './headers';
import { parseResponse } from './response';
import type { RequestOptions } from './request';
import { executeWithRetry } from '../resilience/execute-with-retry';
import { parseError } from '../errors/parse-error';
import { BaseError } from '../errors/BaseError';
import {
  createDebugMiddleware,
  runOnError,
  runOnRequest,
  runOnResponse,
  type Middleware,
} from '../middleware';

export class HttpClient {
  private readonly middlewares: Middleware[];

  constructor(
    private readonly config: {
      apiKey?: string;
      baseURL: string;
      timeout?: number;
      debug?: boolean;
      dryRun?: boolean;
    },
  ) {
    this.middlewares = config.debug ? [createDebugMiddleware()] : [];
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
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

        await runOnRequest(this.middlewares, requestContext);

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

          if (!response.ok) {
            const error = await parseError(response);
            await runOnError(this.middlewares, error);
            throw error;
          }

          await runOnResponse(this.middlewares, response);

          return parseResponse<T>(response);
        } catch (error) {
          if (!(error instanceof BaseError)) {
            await runOnError(this.middlewares, error);
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
