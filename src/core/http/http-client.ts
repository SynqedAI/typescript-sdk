import { logDebugError, logDebugRequest, logDebugResponse } from '@/core/debug';
import { NetworkError } from '@/core/errors/network-error';
import { parseError } from '@/core/errors/parse-error';
import { SynqedError } from '@/core/errors/synqed-error';
import {
  buildHeaders,
  createTimeoutSignal,
} from '@/core/http/headers';
import type { RequestOptions } from '@/core/http/request';
import { parseResponse } from '@/core/http/response';
import { executeWithRetry } from '@/core/resilience/execute-with-retry';
import type { RetryConfig } from '@/core/resilience/retry-delay';

export interface HttpClientConfig {
  apiKey?: string;
  baseUrl: string;
  timeoutMs?: number;
  debug?: boolean;
  retries?: RetryConfig | false;
}

/** @internal */
export class HttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const signal =
      timeoutMs !== undefined
        ? createTimeoutSignal(timeoutMs, options.signal)
        : options.signal;
    const hasBody = init.body !== undefined && init.body !== null;

    return executeWithRetry(
      async (requestSignal) => {
        const requestInit: RequestInit = {
          ...init,
          signal: requestSignal,
          headers: {
            ...buildHeaders({
              apiKey: this.config.apiKey,
              idempotencyKey: options.idempotencyKey,
              hasBody,
            }),
            ...init.headers,
          },
        };

        if (this.config.debug) {
          logDebugRequest(url, requestInit);
        }

        try {
          const response = await fetch(url, requestInit);

          if (!response.ok) {
            const error = await parseError(response);

            if (this.config.debug) {
              logDebugError(error);
            }

            throw error;
          }

          if (this.config.debug) {
            logDebugResponse(response);
          }

          return parseResponse<T>(response);
        } catch (error) {
          if (!(error instanceof SynqedError)) {
            if (this.config.debug) {
              logDebugError(error);
            }

            if (error instanceof TypeError) {
              throw new NetworkError(error.message);
            }
          }

          throw error;
        }
      },
      {
        method: init.method,
        hasIdempotencyKey: Boolean(options.idempotencyKey),
        signal,
        retries: this.config.retries,
      },
    );
  }
}
